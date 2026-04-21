import { test, expect } from "@playwright/test";

test.use({ baseURL: "http://localhost:3001" });

test.describe("Auth + Teams Stability", () => {
  test.setTimeout(180000);

  test("home team state stays consistent after refresh and relogin cycles", async ({
    page,
    context,
  }) => {
    const email = "alvinferinaputra2023@student.unas.ac.id";
    const password = "12345678";

    const getHomeSnapshot = async () => {
      await page.goto("/home");
      await expect(page.getByText("Ruang Kerja Anda")).toBeVisible({
        timeout: 15000,
      });

      const emptyCount = await page.getByText("Belum Ada Proyek").count();
      const projectCards = page.locator('a[href^="/projects/"]');
      const projectCount = await projectCards.count();

      let firstProjectText = "";
      if (projectCount > 0) {
        firstProjectText = (await projectCards.first().innerText()).trim();
      }

      return {
        empty: emptyCount > 0,
        projectCount,
        firstProjectText,
      };
    };

    const doLogin = async () => {
      await page.goto("/auth/login");
      await page.fill("#admin-email", email);
      await page.fill("#admin-password", password);
      await page.getByRole("button", { name: "Masuk" }).click();
      await page.waitForURL("**/home", { timeout: 30000 });
    };

    // Scenario 1: login
    await doLogin();
    const baseline = await getHomeSnapshot();

    // Scenario 2: refresh while logged in
    await page.reload();
    const afterRefresh = await getHomeSnapshot();
    expect(afterRefresh.empty).toBe(baseline.empty);
    expect(afterRefresh.projectCount).toBe(baseline.projectCount);
    if (baseline.projectCount > 0) {
      expect(afterRefresh.firstProjectText).toContain(
        baseline.firstProjectText.split("\n")[0],
      );
    }

    // Scenario 4: open new tab while logged in
    const secondTab = await context.newPage();
    await secondTab.goto("http://localhost:3001/home");
    await expect(secondTab.getByText("Ruang Kerja Anda")).toBeVisible({
      timeout: 15000,
    });
    const secondTabProjects = await secondTab
      .locator('a[href^="/projects/"]')
      .count();
    expect(secondTabProjects).toBe(baseline.projectCount);
    await secondTab.close();

    // Scenario 3: login -> logout -> login cycle x3
    for (let i = 0; i < 3; i += 1) {
      await page.goto("/home/settings");
      await page.getByRole("button", { name: "Keluar Dari Sesi Akun" }).click();
      await Promise.race([
        page.waitForURL("**/", { timeout: 20000 }),
        page.waitForURL("**/auth/login", { timeout: 20000 }),
      ]);

      await doLogin();
      const cycleSnapshot = await getHomeSnapshot();
      expect(cycleSnapshot.empty).toBe(baseline.empty);
      expect(cycleSnapshot.projectCount).toBe(baseline.projectCount);
      if (baseline.projectCount > 0) {
        expect(cycleSnapshot.firstProjectText).toContain(
          baseline.firstProjectText.split("\n")[0],
        );
      }
    }
  });
});
