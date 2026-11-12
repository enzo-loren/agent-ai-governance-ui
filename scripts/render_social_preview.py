#!/usr/bin/env python3
"""Render the actual Overview into a 1200x630 Open Graph sharing image.

Requires playwright==1.57.0 and playwright chromium, as used by CI.
Run: python scripts/render_social_preview.py
"""
from __future__ import annotations

import base64
from pathlib import Path
import sys

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'qa'))
from run_journeys import inline_document  # noqa: E402

OUT = ROOT / 'assets' / 'social' / 'overview-og.png'

def render() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=['--no-sandbox'])
        try:
            app = browser.new_page(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
            app.set_content(inline_document(ROOT), wait_until='load')
            app.locator('#main .hero h1').wait_for()
            headline = app.locator('#main .hero h1').inner_text()
            assert 'Agent activity' in headline, f'Unexpected Overview headline: {headline}'
            app.wait_for_timeout(200)
            dashboard_png = app.screenshot(
                type='png',
                clip={'x': 247, 'y': 65, 'width': 1155, 'height': 718},
                animations='disabled',
            )
            app.close()
            hero_b64 = base64.b64encode(dashboard_png).decode('ascii')
            wordmark_b64 = base64.b64encode(
                (ROOT / 'assets' / 'branding' / 'morris-wordmark.png').read_bytes()
            ).decode('ascii')
            share = browser.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=1)
            share.set_content(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<style>
  * {{ box-sizing:border-box; }}
  html,body {{margin:0;width:1200px;height:630px;overflow:hidden;}}
  body {{ font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
    background:linear-gradient(130deg,#fbfdfb 0%,#f1f7f3 70%,#e9f4ee 100%);
    color:#172b29; }}
  .card {{position:relative;width:1200px;height:630px;overflow:hidden;isolation:isolate;}}
  .card::before {{content:"";position:absolute;inset:0;
    background:radial-gradient(ellipse 630px 480px at 100% 90%,#d9eee3,transparent);
    pointer-events:none;}}
  .left {{position:absolute;top:64px;left:67px;width:421px;z-index:2;}}
  .wordmark {{display:block;width:205px;height:auto;filter:brightness(0);}}
  .divider {{width:40px;height:3px;border-radius:3px;background:#1b745e;margin:55px 0 31px;}}
  .eyebrow {{font-size:12px;line-height:1.3;font-weight:800;letter-spacing:2.1px;color:#286b58;text-transform:uppercase;}}
  h1 {{font-size:61px;line-height:1.045;letter-spacing:-2.7px;font-weight:750;margin:18px 0 20px;}}
  .description {{font-size:19px;line-height:1.48;color:#546b65;margin:0;max-width:375px;}}
  .footer {{position:absolute;top:548px;left:67px;display:flex;align-items:center;gap:10px;
    font-size:13px;color:#487567;letter-spacing:.02em;font-weight:650;}}
  .footer-dot {{width:8px;height:8px;border-radius:50%;background:#18775f;}}
  .preview {{position:absolute;z-index:1;left:516px;top:59px;width:905px;height:548px;
    background:white;border:1px solid #d5e3dc;border-radius:19px;
    overflow:hidden;box-shadow:0 30px 65px rgba(28,68,52,.15),0 4px 14px rgba(28,68,52,.07);}}
  .browser-bar {{display:flex;align-items:center;height:37px;padding:0 17px;gap:7px;
    border-bottom:1px solid #e6eee8;background:#fcfdfc;}}
  .browser-bar b {{width:8px;height:8px;background:#d4dfd9;border-radius:50%;display:block;}}
  .browser-bar span {{font-size:11px;color:#8a9992;margin-left:17px;letter-spacing:.01em;}}
  .preview img {{display:block;width:905px;height:auto;}}
</style></head><body><div class="card">
  <div class="left">
    <img class="wordmark" src="data:image/png;base64,{wordmark_b64}" alt="Morris & Opazo">
    <div class="divider"></div>
    <div class="eyebrow">Agent Governance</div>
    <h1>Agent activity,<br>at a glance.</h1>
    <p class="description">A clear view of requests, decisions, tools and spending.</p>
  </div>
  <div class="footer"><span class="footer-dot"></span>Overview · AI agent governance</div>
  <div class="preview">
    <div class="browser-bar"><b></b><b></b><b></b><span>Agent Governance / Overview</span></div>
    <img src="data:image/png;base64,{hero_b64}" alt="Agent Governance Overview interface">
  </div>
</div></body></html>""", wait_until='load')
            share.wait_for_function(
                "() => [...document.images].every(img => img.complete && img.naturalWidth > 0)"
            )
            OUT.parent.mkdir(parents=True, exist_ok=True)
            share.screenshot(path=str(OUT), type='png', animations='disabled')
            share.close()
            data = OUT.read_bytes()
            assert data[:8] == bytes.fromhex('89504e470d0a1a0a')
            assert int.from_bytes(data[16:20], 'big') == 1200
            assert int.from_bytes(data[20:24], 'big') == 630
            print(f'Generated {OUT.relative_to(ROOT)} ({len(data):,} bytes)')
        finally:
            browser.close()

if __name__ == '__main__':
    render()
