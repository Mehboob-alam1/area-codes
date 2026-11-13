import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";

describe("directory API", () => {
  it("returns Pakistan for a calling-code search and does not invent a Gilgit code", async () => {
    const search = await request(app).get("/api/v1/search").query({ q: "+92" });
    expect(search.status).toBe(200);
    expect(search.body.data.some((hit: { title: string }) => hit.title === "Pakistan")).toBe(true);

    const gilgit = await request(app).get("/api/v1/search").query({ q: "Gilgit" });
    expect(gilgit.status).toBe(200);
    expect(gilgit.body.data.some((hit: { type: string; title: string }) => hit.type === "city" && hit.title === "Gilgit")).toBe(true);
    expect(gilgit.body.data.some((hit: { type: string }) => hit.type === "area_code")).toBe(false);

    const city = await request(app).get("/api/v1/countries/pakistan/cities/gilgit");
    expect(city.status).toBe(200);
    expect(city.body.data.areaCodes).toEqual([]);
  });

  it("keeps a shared area code attached to more than one city", async () => {
    const response = await request(app).get("/api/v1/area-codes/code/51").query({ country: "PK" });
    expect(response.status).toBe(200);
    const record = response.body.data.find((item: { countryIso2: string }) => item.countryIso2 === "PK");
    expect(record.locations.map((location: { cityName: string }) => location.cityName).sort()).toEqual(["Islamabad", "Rawalpindi"]);
  });

  it("does not list geographic codes for Singapore", async () => {
    const response = await request(app).get("/api/v1/countries/singapore");
    expect(response.status).toBe(200);
    expect(response.body.data.areaCodes).toEqual([]);
    expect(response.body.data.country.callingCode).toBe("+65");
  });

  it("parses a Pakistan mobile format and redacts the number from search logs", async () => {
    const parsed = await request(app).post("/api/v1/phone/parse").send({ phoneNumber: "+923001234567" });
    expect(parsed.status).toBe(200);
    expect(parsed.body.country).toBe("Pakistan");
    expect(parsed.body.countryCallingCode).toBe("+92");
    expect(parsed.body.isPossible).toBe(true);
    expect(parsed.body.disclaimer).toMatch(/does not prove/i);

    const number = "+923001234567";
    await request(app).get("/api/v1/search").query({ q: number });
    const login = await request(app).post("/api/v1/admin/auth/login").send({ email: "admin@test.local", password: "TestAdmin!2026" });
    expect(login.status).toBe(200);
    const logs = await request(app).get("/api/v1/admin/search-logs").set("Authorization", `Bearer ${login.body.data.token}`);
    expect(logs.status).toBe(200);
    const stored = JSON.stringify(logs.body.data);
    expect(stored).not.toContain("3001234567");
    expect(stored).toContain("redacted:phone:");
  });

  it("blocks an editor from deleting records", async () => {
    const login = await request(app).post("/api/v1/admin/auth/login").send({ email: "admin@test.local", password: "TestAdmin!2026" });
    const token = login.body.data.token;
    const created = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Editor Example", email: "editor@test.local", password: "EditorPass!2026", role: "editor" });
    expect(created.status).toBe(201);
    const editorLogin = await request(app).post("/api/v1/admin/auth/login").send({ email: "editor@test.local", password: "EditorPass!2026" });
    const country = await request(app).get("/api/v1/countries/pakistan");
    const removed = await request(app)
      .delete(`/api/v1/admin/countries/${country.body.data.country.id}`)
      .set("Authorization", `Bearer ${editorLogin.body.data.token}`);
    expect(removed.status).toBe(403);
  });
});
