"""登录、会话、用户资料、注销。"""

from __future__ import annotations

from tests.helpers import BaseCase


class AuthTests(BaseCase):
    def test_send_code_rejects_bad_phone(self):
        r = self.client.post("/api/auth/send-code", json={"phone": "12345"})
        self.assertEqual(r.status_code, 422)

    def test_send_code_rate_limited(self):
        self.client.post("/api/auth/send-code", json={"phone": "13800138000"})
        r = self.client.post("/api/auth/send-code", json={"phone": "13800138000"})
        self.assertEqual(r.status_code, 429)

    def test_wrong_code_counts_failures_and_locks(self):
        self.client.post("/api/auth/send-code", json={"phone": "13800138001"})
        for i in range(4):
            r = self.client.post("/api/auth/verify", json={"phone": "13800138001", "code": "000000"})
            self.assertEqual(r.status_code, 400, r.text)
        r = self.client.post("/api/auth/verify", json={"phone": "13800138001", "code": "000000"})
        self.assertEqual(r.status_code, 429, r.text)
        # 锁定后即使输入正确验证码也拒绝
        r = self.client.post("/api/auth/verify", json={"phone": "13800138001", "code": "123456"})
        self.assertEqual(r.status_code, 429)

    def test_login_returns_token_and_new_user_flag(self):
        token = self.login()
        self.assertTrue(token)
        r = self.client.post("/api/auth/send-code", json={"phone": "13800138000"})
        self.assertEqual(r.status_code, 429)  # 60 秒内不能重复发

    def test_second_login_is_not_new_user(self):
        self.login("13800138002")
        self.client.post("/api/auth/send-code", json={"phone": "13800138002"})
        # 绕过 60 秒限制：直接删掉发送记录
        import sqlite3

        con = sqlite3.connect(self.db_file)
        con.execute("DELETE FROM sms_limits")
        con.commit()
        con.close()
        self.client.post("/api/auth/send-code", json={"phone": "13800138002"})
        r = self.client.post("/api/auth/verify", json={"phone": "13800138002", "code": "123456"})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertFalse(r.json()["is_new_user"])

    def test_profile_requires_auth(self):
        r = self.client.get("/api/user/profile")
        self.assertEqual(r.status_code, 401)

    def test_logout_invalidates_token(self):
        token = self.login()
        r = self.client.post("/api/auth/logout", headers=self.auth(token))
        self.assertEqual(r.status_code, 200)
        r = self.client.get("/api/user/profile", headers=self.auth(token))
        self.assertEqual(r.status_code, 401)

    def test_profile_update_is_partial(self):
        token = self.login()
        r = self.client.put(
            "/api/user/profile",
            json={"name": "小林", "height": 170},
            headers=self.auth(token),
        )
        self.assertEqual(r.status_code, 200, r.text)
        body = r.json()
        self.assertEqual(body["name"], "小林")
        self.assertEqual(body["height"], 170)
        self.assertEqual(body["gender"], "unspecified")
        r = self.client.put("/api/user/profile", json={"city": "上海"}, headers=self.auth(token))
        self.assertEqual(r.json()["name"], "小林")
        self.assertEqual(r.json()["city"], "上海")

    def test_profile_validates_ranges(self):
        token = self.login()
        for payload in ({"height": 20}, {"weight": 500}, {"gender": "other"}):
            r = self.client.put("/api/user/profile", json=payload, headers=self.auth(token))
            self.assertEqual(r.status_code, 422, payload)

    def test_style_tags_limits(self):
        token = self.login()
        r = self.client.put(
            "/api/user/profile",
            json={"style_tags": ["简约"] * 11},
            headers=self.auth(token),
        )
        self.assertEqual(r.status_code, 422)

    def test_delete_account_requires_phrase(self):
        token = self.login()
        r = self.client.request(
            "DELETE", "/api/user", json={"confirm": "删除"}, headers=self.auth(token)
        )
        self.assertEqual(r.status_code, 400)
        r = self.client.request(
            "DELETE", "/api/user", json={"confirm": "删除我的账号"}, headers=self.auth(token)
        )
        self.assertEqual(r.status_code, 200, r.text)
        r = self.client.get("/api/user/profile", headers=self.auth(token))
        self.assertEqual(r.status_code, 401)