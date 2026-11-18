#!/usr/bin/env python3
"""Gán ảnh đại diện ngẫu nhiên cho tài khoản sinh viên (giả lập và kiểm tra đồng bộ ảnh ở số lượng lớn).

Mỗi sinh viên nhận MỘT TỆP RIÊNG trong uploads/avatars/ (giống ảnh người dùng tự tải lên qua /api/account/avatar:
tên `<8 ký tự uid>_<12 hex>.jpg`, user/{uid}.avatar = "/uploads/avatars/<tên>"), nên dung lượng và số tệp đúng như thật.
Ảnh lấy ngẫu nhiên từ thư mục đã chuẩn bị bằng scripts/prepare_avatars.ps1 (256×256 JPEG). Cách chia: xáo trộn cả bộ ảnh rồi phát
lần lượt, hết bộ thì xáo lại, nên mọi ảnh đều được dùng trước khi có ảnh nào dùng lần hai (vẫn ngẫu nhiên, nhưng không bỏ sót ảnh).

  python3 scripts/assign_avatars.py --data-dir /var/lib/studytask --images ~/avatars-256            # sinh viên do seed_curriculum.py tạo
  python3 scripts/assign_avatars.py --data-dir ... --images ... --dry-run                           # chỉ báo kế hoạch
  python3 scripts/assign_avatars.py --data-dir ... --remove                                         # gỡ đúng các ảnh do script này gán

Không ghi đè ảnh người dùng tự đặt (chỉ thay ảnh do chính script gán trước đó), trừ khi có --overwrite.
Chỉ dùng thư viện chuẩn. Ghi trực tiếp vào SQLite (an toàn khi API đang chạy: giao dịch ngắn, chế độ WAL).
"""
import argparse, json, os, random, secrets, sqlite3, sys, time

SEED_TAG = 'curriculum-v1'        # nhãn của seed_curriculum.py trên hồ sơ sinh viên
AVATAR_TAG = 'avatars-v1'         # nhãn trên hồ sơ có ảnh do script này gán
META_ID = 'seed_avatars_v1'
PREFIX = '/uploads/avatars/'


def human(n):
    for u in ('B', 'KB', 'MB', 'GB'):
        if n < 1024 or u == 'GB':
            return f'{n:.1f} {u}' if u != 'B' else f'{n} B'
        n /= 1024


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--data-dir', required=True, help='thư mục dữ liệu của máy chủ (chứa studytask.db và uploads/)')
    ap.add_argument('--images', help='thư mục ảnh 256×256 .jpg đã chuẩn bị')
    ap.add_argument('--seed', type=int, default=20261114, help='hạt giống ngẫu nhiên (cùng hạt giống → cùng cách chia ảnh)')
    ap.add_argument('--all-students', action='store_true', help='cả sinh viên không do seed_curriculum.py tạo (mặc định: chỉ sinh viên của seed)')
    ap.add_argument('--overwrite', action='store_true', help='ghi đè cả ảnh người dùng tự đặt (không khuyến nghị)')
    ap.add_argument('--limit', type=int, help='chỉ gán cho N sinh viên đầu tiên (thử nhỏ)')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--remove', action='store_true', help='gỡ ảnh do script này gán (xóa tệp, bỏ avatar khỏi hồ sơ)')
    a = ap.parse_args(argv)

    data = os.path.abspath(a.data_dir)
    db_path = os.path.join(data, 'studytask.db')
    if not os.path.exists(db_path):
        sys.exit(f'Không thấy {db_path}')
    avdir = os.path.join(data, 'uploads', 'avatars')
    con = sqlite3.connect(db_path, timeout=30, isolation_level=None)
    con.execute('PRAGMA journal_mode=WAL')
    users = [(uid, json.loads(d)) for uid, d in con.execute("SELECT id, data FROM docs WHERE col='user'")]

    if a.remove:
        mine = [(uid, d) for uid, d in users if d.get('avatarSeed') == AVATAR_TAG]
        con.execute('BEGIN IMMEDIATE')
        for uid, d in mine:
            url = d.pop('avatar', '')
            d.pop('avatarSeed', None)
            con.execute("UPDATE docs SET data=? WHERE col='user' AND id=?", (json.dumps(d, ensure_ascii=False), uid))
            if url.startswith(PREFIX):
                try:
                    os.remove(os.path.join(avdir, os.path.basename(url)))
                except OSError:
                    pass
        con.execute("DELETE FROM docs WHERE col='meta' AND id=?", (META_ID,))
        con.execute('COMMIT')
        con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
        print(f'Đã gỡ ảnh đại diện của {len(mine)} sinh viên.')
        return 0

    if not a.images or not os.path.isdir(a.images):
        sys.exit('Thiếu --images (thư mục ảnh đã chuẩn bị).')
    pool = sorted(f for f in os.listdir(a.images) if f.lower().endswith('.jpg'))
    if not pool:
        sys.exit('Thư mục ảnh không có tệp .jpg nào.')

    def eligible(d):
        if d.get('role') != 'student':
            return False
        if not a.all_students and d.get('seed') != SEED_TAG:
            return False
        return a.overwrite or not d.get('avatar') or d.get('avatarSeed') == AVATAR_TAG   # không đè ảnh người dùng tự đặt
    targets = sorted((uid, d) for uid, d in users if eligible(d))
    skipped = sum(1 for _, d in users if d.get('role') == 'student' and (a.all_students or d.get('seed') == SEED_TAG) and not eligible(d))
    if a.limit:
        targets = targets[:a.limit]

    rng = random.Random(a.seed)
    deck, picks = [], []
    for _ in targets:
        if not deck:
            deck = pool[:]
            rng.shuffle(deck)
        picks.append(deck.pop())
    sizes = {f: os.path.getsize(os.path.join(a.images, f)) for f in set(picks)}
    total = sum(sizes[f] for f in picks)
    print(f'Sinh viên được gán: {len(targets)} (bỏ qua {skipped} có ảnh tự đặt) | bộ ảnh: {len(pool)} | ảnh khác nhau được dùng: {len(set(picks))} '
          f'| dung lượng sẽ ghi: {human(total)} (TB {human(total // max(1, len(picks)))}/ảnh)')
    if a.dry_run or not targets:
        print('(--dry-run: chưa ghi gì)' if a.dry_run else 'Không có sinh viên nào cần gán.')
        return 0

    os.makedirs(avdir, exist_ok=True)
    os.chmod(avdir, 0o755)            # nginx (www-data) phải đọc được thư mục; API tạo thư mục này với quyền 750 nếu umask chặt
    t0 = time.time()
    written, updates, old_files = [], [], []
    try:
        for (uid, d), pic in zip(targets, picks):
            with open(os.path.join(a.images, pic), 'rb') as f:
                blob = f.read()
            if not blob.startswith(b'\xff\xd8'):
                raise ValueError(f'{pic} không phải JPEG')
            stored = f'{uid[:8]}_{secrets.token_hex(6)}.jpg'
            path = os.path.join(avdir, stored)
            with open(path, 'wb') as f:
                f.write(blob)
            os.chmod(path, 0o644)
            written.append(path)
            if str(d.get('avatar', '')).startswith(PREFIX):
                old_files.append(os.path.join(avdir, os.path.basename(d['avatar'])))      # ảnh cũ của chính script hoặc (với --overwrite) của người dùng
            updates.append((json.dumps({**d, 'avatar': PREFIX + stored, 'avatarSeed': AVATAR_TAG}, ensure_ascii=False), uid))
        con.execute('BEGIN IMMEDIATE')
        con.executemany("UPDATE docs SET data=? WHERE col='user' AND id=?", updates)
        con.execute("INSERT OR REPLACE INTO docs VALUES ('meta',?,?)", (META_ID, json.dumps(
            {'at': time.time(), 'students': len(updates), 'pool': len(pool), 'distinct': len(set(picks)), 'seed': a.seed}, ensure_ascii=False)))
        con.execute('COMMIT')
    except BaseException:
        if con.in_transaction:
            con.execute('ROLLBACK')
        for p in written:                 # không để tệp mồ côi nếu ghi dở
            try:
                os.remove(p)
            except OSError:
                pass
        raise
    for p in old_files:
        try:
            os.remove(p)
        except OSError:
            pass
    con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
    n_files = len(os.listdir(avdir))
    print(f'Đã gán ảnh đại diện cho {len(updates)} sinh viên trong {time.time() - t0:.1f}s. uploads/avatars/ hiện có {n_files} tệp.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
