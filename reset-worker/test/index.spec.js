import { env } from "cloudflare:test";
import { afterEach, describe, it, expect, vi } from "vitest";
import worker from "../src";

const URL = "http://example.com";
const testEnv = { ...env, FIREBASE_API_KEY: "test-key" };

const post = (body) =>
	worker.fetch(
		new Request(URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: typeof body === "string" ? body : JSON.stringify(body),
		}),
		testEnv,
	);

afterEach(() => vi.restoreAllMocks());

describe("reset-worker", () => {
	it("trả 405 khi không phải POST", async () => {
		const res = await worker.fetch(new Request(URL), testEnv);
		expect(res.status).toBe(405);
	});

	it("trả 200 kèm tiêu đề CORS cho OPTIONS", async () => {
		const res = await worker.fetch(new Request(URL, { method: "OPTIONS" }), testEnv);
		expect(res.status).toBe(200);
		expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
	});

	it("trả 400 khi email thiếu hoặc sai định dạng, không gọi Identity Toolkit", async () => {
		const spy = vi.spyOn(globalThis, "fetch");
		for (const body of [{}, { email: "khong-phai-email" }, "khong-phai-json"]) {
			const res = await post(body);
			expect(res.status).toBe(400);
		}
		expect(spy).not.toHaveBeenCalled();
	});

	it("gọi sendOobCode với PASSWORD_RESET và trả { ok: true } khi Firebase trả 200", async () => {
		const spy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(Response.json({ kind: "identitytoolkit#GetOobConfirmationCodeResponse" }));
		const res = await post({ email: "a@b.vn" });
		expect(await res.json()).toEqual({ ok: true });

		const [url, init] = spy.mock.calls[0];
		expect(url).toContain("accounts:sendOobCode?key=test-key");
		expect(JSON.parse(init.body)).toEqual({ requestType: "PASSWORD_RESET", email: "a@b.vn" });
	});

	it("trả 400 { ok: false } và không lộ mã lỗi của Firebase", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			Response.json({ error: { message: "EMAIL_NOT_FOUND" } }, { status: 400 }),
		);
		const res = await post({ email: "a@b.vn" });
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ ok: false });
	});
});
