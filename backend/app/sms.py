"""腾讯云短信。开发模式不调用，由 auth.py 直接用固定验证码。"""

from __future__ import annotations

from .config import settings


class SMSNotConfigured(RuntimeError):
    pass


async def send_code(phone: str, code: str) -> None:
    if not settings.is_production:
        return
    sms = settings.sms
    if not all(sms.get(k) for k in ("secret_id", "secret_key", "sdk_app_id", "sign_name", "template_id")):
        raise SMSNotConfigured("短信服务未配置")

    from tencentcloud.common import credential
    from tencentcloud.common.profile.client_profile import ClientProfile
    from tencentcloud.common.profile.http_profile import HttpProfile
    from tencentcloud.sms.v20210111 import models, sms_client

    cred = credential.Credential(sms["secret_id"], sms["secret_key"])
    http = HttpProfile(endpoint="sms.tencentcloudapi.com")
    client = sms_client.SmsClient(cred, sms["region"], ClientProfile(httpProfile=http))
    req = models.SendSmsRequest()
    req.SmsSdkAppId = sms["sdk_app_id"]
    req.SignName = sms["sign_name"]
    req.TemplateId = sms["template_id"]
    req.PhoneNumberSet = [f"+86{phone}"]
    req.TemplateParamSet = [code]
    client.SendSms(req)
