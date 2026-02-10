import sys
from curl_cffi import requests

token = "y_kblnrxHFj2YdggACzWPIJhpYit0eiRabIJj0q6GeE"

headers = {
    "Authorization": f"Bearer {token}",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

try:
    # 测试获取特朗普用户信息
    response = requests.get(
        "https://truthsocial.com/api/v1/accounts/lookup?acct=realDonaldTrump",
        headers=headers,
        impersonate="chrome110",
        timeout=15
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    
    if response.status_code == 200:
        print("✅ Token is valid!")
        sys.exit(0)
    else:
        print("❌ Token is invalid or expired")
        sys.exit(1)
        
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
