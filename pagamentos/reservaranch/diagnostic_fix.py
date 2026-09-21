#!/usr/bin/env python3
"""Diagnostic and fix script for Arizona Ranch reservation site."""
import urllib.request, urllib.error, sys, time, json, subprocess, os

SITE = "https://catalogo-cruzeiro-web.onrender.com/pagamentos/reservaranch"
PROJECT_DIR = r"C:\Users\junio\projeto codex\pagamentos\reservaranch"
GIT_DIR = r"C:\Users\junio\projeto codex"

def http_get(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.read().decode('utf-8'), r.status
    except Exception as e:
        return None, str(e)

def run_cmd(cmd, cwd=None):
    try:
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, shell=True, timeout=30)
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return -1, "", str(e)

def check_site():
    print("=== CHECKING SITE ===")

    # Check HTML
    html, status = http_get(SITE + "/")
    if not html:
        return {"error": f"HTML fetch failed: {status}"}

    issues = []
    if 'is-opening' not in html:
        issues.append("BODY missing is-opening class")
    if 'opening-screen' not in html:
        issues.append("opening-screen section missing")
    if 'start-experience' not in html:
        issues.append("start-experience button missing")
    if 'site-shell' not in html:
        issues.append("site-shell missing")
    if 'table-grid' not in html:
        issues.append("table-grid missing")

    # Check JS
    js, status = http_get(SITE + "/app.js")
    if js:
        if 'function startExperience' not in js:
            issues.append("startExperience function missing")
        if 'addEventListener' not in js or 'start-experience' not in js:
            issues.append("start-experience event listener missing")
        if 'setupOpening' not in js:
            issues.append("setupOpening function missing")
    else:
        issues.append(f"JS fetch failed: {status}")

    # Check CSS
    css, status = http_get(SITE + "/arizona.css")
    if not css:
        issues.append(f"CSS fetch failed: {status}")

    if issues:
        return {"status": "BROKEN", "issues": issues}
    return {"status": "OK", "message": "All checks passed"}

def fix_opening_button():
    """Fix the start-experience button event listener."""
    print("=== FIXING OPENING BUTTON ===")

    app_js_path = os.path.join(PROJECT_DIR, "app.js")

    with open(app_js_path, "r", encoding="utf-8") as f:
        js = f.read()

    # Check if listener already exists
    if 'start-experience' in js and 'addEventListener' in js and 'startExperience' in js:
        print("Listener already exists")
        return True

    # Find bindEvents and add the listener
    if 'function bindEvents()' in js:
        # Add at end of bindEvents
        if 'function bindEvents() {' in js:
            # Find the end of bindEvents
            bind_start = js.find('function bindEvents() {')
            # Find the next function after bindEvents
            next_func = js.find('\n  function ', bind_start + 20)
            if next_func > 0:
                # Insert before next function
                insert_point = next_func
                listener_code = '\n    document.querySelector("#start-experience")?.addEventListener("click", startExperience);'
                js = js[:insert_point] + listener_code + js[insert_point:]

                with open(app_js_path, "w", encoding="utf-8") as f:
                    f.write(js)
                print("Added listener to bindEvents")
                return True

    # Alternative: ensure setupOpening and startExperience exist
    if 'function setupOpening()' not in js:
        # Add setupOpening function
        setup = '''function setupOpening() {
    var btn = document.getElementById("start-experience");
    if(btn){btn.disabled=false;btn.textContent="Reservar mesa";}
    var progress = document.getElementById("opening-progress");
    if(progress)progress.style.width="100%";
}
'''
        # Insert before bindEvents
        if 'function bindEvents()' in js:
            bind_pos = js.find('function bindEvents()')
            js = js[:bind_pos] + setup + js[bind_pos:]
            with open(app_js_path, "w", encoding="utf-8") as f:
                f.write(js)
            print("Added setupOpening function")

    if 'function startExperience()' not in js:
        start_exp = '''function startExperience() {
    var screen = document.getElementById("opening-screen");
    if(screen)screen.classList.add("is-complete");
    document.body.classList.remove("is-opening");
}
'''
        if 'function bindEvents()' in js:
            bind_pos = js.find('function bindEvents()')
            js = js[:bind_pos] + start_exp + js[bind_pos:]
            with open(app_js_path, "w", encoding="utf-8") as f:
                f.write(js)
            print("Added startExperience function")

    return True

def deploy():
    """Commit, push and deploy."""
    print("=== DEPLOYING ===")

    # Git add and commit
    code, out, err = run_cmd('git add -A', cwd=GIT_DIR)
    if code != 0:
        print(f"git add failed: {err}")
        return False

    code, out, err = run_cmd('git commit -m "fix: opening button and flow"', cwd=GIT_DIR)
    if code != 0:
        # Maybe nothing to commit
        print(f"git commit: {out} {err}")

    # Push
    code, out, err = run_cmd('git push origin main', cwd=GIT_DIR)
    if code != 0:
        print(f"git push failed: {err}")
        return False

    print("Pushed to GitHub")

    # Trigger deploy via Render API
    code, out, err = run_cmd(f'node scripts/render-api-bridge.js deploy --service catalogo-cruzeiro-web --clearCache', cwd=GIT_DIR)
    print(f"Deploy triggered: {out}")

    return True

def main():
    print("=== ARIZONA RANCH DIAGNOSTIC & FIX ===")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Check current state
    result = check_site()
    print(json.dumps(result, indent=2))

    if result.get("status") != "OK":
        print("\n=== ATTEMPTING FIX ===")
        fix_opening_button()
        deploy()
        print("\nWaiting 60 seconds for deploy...")
        time.sleep(60)

        # Check again
        print("\n=== VERIFYING AFTER FIX ===")
        result2 = check_site()
        print(json.dumps(result2, indent=2))

    print("\n=== DONE ===")

if __name__ == "__main__":
    main()
