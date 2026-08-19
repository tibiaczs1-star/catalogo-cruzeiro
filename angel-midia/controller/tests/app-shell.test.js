// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { createApp } from '../src/app.js';
const rootDir=process.cwd();
beforeEach(()=>{document.body.innerHTML='<div id="app"></div>'});
it('mostra login sem sessão e links dos dois APKs versionados',async()=>{await createApp({root:document.querySelector('#app'),apiClient:vi.fn().mockRejectedValue(new Error('401'))});expect(document.querySelector('[data-view=login]')).not.toBeNull();expect([...document.querySelectorAll('.app-downloads a')].map(a=>a.href)).toHaveLength(2);expect(document.querySelector('[name=identifier]').value).toBe('admin')});
it('registra o service worker',async()=>{const register=vi.fn().mockResolvedValue({});Object.defineProperty(navigator,'serviceWorker',{configurable:true,value:{register}});await createApp({root:document.querySelector('#app'),apiClient:vi.fn().mockRejectedValue(new Error('401'))});expect(register).toHaveBeenCalledWith('./sw.js',{scope:'./'})});
it('mantém manifest instalável e ícones presentes',()=>{const manifest=JSON.parse(readFileSync(`${rootDir}/manifest.webmanifest`,'utf8'));expect(manifest.name).toContain('Angel');for(const icon of manifest.icons)expect(existsSync(`${rootDir}/${icon.src}`)).toBe(true)});
it('não armazena respostas privadas da API no cache',()=>{const worker=readFileSync(`${rootDir}/sw.js`,'utf8');expect(worker).toContain("request.url.includes('/api/')");expect(worker).toContain('caches.open')});
