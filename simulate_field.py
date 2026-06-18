import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_simulation():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1600,1200')
    
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 10)
    
    # Store screenshots in the workspace root for convenience
    output_dir = "."
    
    try:
        print("Navigating to http://localhost:5173/...")
        driver.get('http://localhost:5173/')
        time.sleep(2)
        
        # 0. Reset database to starting state
        print("Resetting database...")
        reset_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@title='데이터 초기화']")))
        reset_btn.click()
        time.sleep(1.5)
        
        # 1. Switch to B2B Portal (Client_B2B)
        print("Switching to B2B Portal...")
        b2b_role_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='B2B Portal (식권대장)']")))
        b2b_role_btn.click()
        time.sleep(1.5)
        
        # Register a new worker "김철수", phone "010-5555-4444"
        print("Registering a new worker '김철수'...")
        name_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='예: 홍길동']")))
        name_input.send_keys("김철수")
        
        phone_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='예: 010-9999-8888']")))
        phone_input.send_keys("010-5555-4444")
        time.sleep(1)
        
        grant_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '일일 25,000 P 권한 부여')]")))
        grant_btn.click()
        time.sleep(1)
        
        # Accept the registration alert
        try:
            alert = driver.switch_to.alert
            print(f"Alert text: {alert.text}")
            alert.accept()
        except Exception as e:
            print("No alert for registration:", e)
            
        time.sleep(1.5)
        
        # 2. Switch to Worker Mobile View (Worker_Mobile)
        print("Switching to Worker Mobile view...")
        worker_role_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='인부 모바일 식권']")))
        worker_role_btn.click()
        time.sleep(1.5)
        
        # Login with phone number "010-5555-4444"
        print("Logging in worker '김철수' via phone number...")
        login_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='예: 010-1234-5678']")))
        login_input.send_keys("010-5555-4444")
        time.sleep(1)
        
        login_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='식권 앱 로그인']")))
        login_btn.click()
        time.sleep(1)
        
        # Accept the login alert
        try:
            alert = driver.switch_to.alert
            print(f"Alert text: {alert.text}")
            alert.accept()
        except Exception as e:
            print("No alert for login:", e)
            
        time.sleep(1.5)
        
        # Take mobile app screenshot
        driver.save_screenshot(f"{output_dir}/mobile_worker_logged_in.png")
        print("Saved mobile worker screenshot.")
        
        # Click "POS 결제창에 이 QR 토큰 자동 입력"
        print("Injecting QR token to POS...")
        inject_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'POS 결제창에 이 QR 토큰 자동 입력')]")))
        inject_btn.click()
        time.sleep(1)
        
        # Accept the injection alert
        try:
            alert = driver.switch_to.alert
            print(f"Alert text: {alert.text}")
            alert.accept()
        except Exception as e:
            print("No alert for injection:", e)
            
        time.sleep(1.5)
        
        # 3. Switch to Store POS
        print("Switching to Store POS view...")
        pos_role_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Store POS & Scanner']")))
        pos_role_btn.click()
        time.sleep(1.5)
        
        # Click "가상 QR 스캔 실행"
        print("Executing virtual QR scan Checkout...")
        scan_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '가상 QR 스캔 실행')]")))
        scan_btn.click()
        time.sleep(3.5) # Wait for success screen
        
        # Take POS checkout screenshot
        driver.save_screenshot(f"{output_dir}/store_pos_success.png")
        print("Saved store POS success screenshot.")
        
        # 4. Switch to Kitchen KDS
        print("Switching to Kitchen KDS view...")
        kds_role_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='주방 KDS 모니터']")))
        kds_role_btn.click()
        time.sleep(2)
        
        # Take KDS screenshot
        driver.save_screenshot(f"{output_dir}/kitchen_kds_queue.png")
        print("Saved kitchen KDS queue screenshot.")
        
        # Click "조리 완료" button on the first card
        print("Completing the order on KDS...")
        complete_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), '조리 완료')]")))
        complete_btn.click()
        time.sleep(1)
        
        # Accept complete alert
        try:
            alert = driver.switch_to.alert
            print(f"Alert text: {alert.text}")
            alert.accept()
        except Exception as e:
            print("No alert for order completion:", e)
            
        time.sleep(2)
        
        # 5. Switch to Super Admin
        print("Switching to Super Admin...")
        admin_role_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Super Admin']")))
        admin_role_btn.click()
        time.sleep(2)
        
        # Scroll to B2B Settlement panel and click "계산서 발행" on Hyundai Construction (c4)
        print("Issuing Tax Invoice for Hyundai Construction B2B account...")
        invoice_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//td[contains(text(), '현대건설')]/ancestor::tr//button[text()='계산서 발행']")))
        invoice_btn.click()
        time.sleep(1)
        
        # Accept invoice alert
        try:
            alert = driver.switch_to.alert
            print(f"Alert text: {alert.text}")
            alert.accept()
        except Exception as e:
            print("No alert for tax invoice:", e)
            
        time.sleep(2)
        
        # Take final Super Admin screenshot
        driver.save_screenshot(f"{output_dir}/super_admin_final.png")
        print("Saved final Super Admin view screenshot.")
        
    except Exception as e:
        print(f"Error occurred during simulation: {e}")
    finally:
        driver.quit()

if __name__ == '__main__':
    run_simulation()
