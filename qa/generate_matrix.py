#!/usr/bin/env python3
"""Produce the human-readable journey matrix from the executed browser report."""
import json
from pathlib import Path
from collections import Counter,OrderedDict
ROOT=Path(__file__).resolve().parents[1]
spec=json.loads((ROOT/'qa/journeys.json').read_text())['journeys']
results={r['id']:r for r in json.loads((ROOT/'qa/journey-results.json').read_text())['results']}
labels={'ui-working':'Funcional (simulado)','partial':'Parcial','gap':'Sin recorrido'}
by=OrderedDict()
for j in spec:by.setdefault(j['area'].split('/')[0],[]).append(j)
md=['# Matriz de recorridos de la consola','',
    'Fuente operativa: [`qa/journeys.json`](../qa/journeys.json); resultados de Chromium: [`qa/journey-results.json`](../qa/journey-results.json).',
    'Requisitos: [`insumo/requisitos.yaml`](https://github.com/enzo-loren/agentic-ai-governance-platform/blob/main/insumo/requisitos.yaml).',
    '', '## Lectura de los pasos','',
    '- **Funcional (simulado):** pasos hasta completar una operación visible en el navegador; no prueba backend.',
    '- **Parcial:** pasos hasta observar la interfaz parcial; no existe el resultado exigido.',
    '- **Sin recorrido:** pasos hasta el punto en el que falta una acción; el objetivo **no tiene** número de pasos de finalización.',
    '- Cuenta una interacción por clic, selección de opción, escritura de un campo o envío. No cuenta pulsaciones individuales al teclear ni desplazamiento. Todos parten de Inicio. Los tiempos y latencia no se infieren de estos números.',
    '', '| Resultado | Casos |','| --- | ---: |']
counts=Counter(j['status'] for j in spec)
for k in ['ui-working','partial','gap']:md.append(f'| {labels[k]} | {counts[k]} |')
md+=['',f'**Total: {len(spec)} recorridos y variantes.** Un caso marcado como «Sin recorrido» no es una prueba funcional aprobada.','']
for area,entries in by.items():
    md+=['## '+area,'','| ID | Acción o variante | Requisitos | Resultado | Pasos desde Inicio |','| --- | --- | --- | --- | ---: |']
    for j in entries:
        r=results[j['id']]
        if r['result']!='as_expected':raise RuntimeError(f"Unexpected test failure {j['id']}: {r.get('error')}")
        steps=f"{r['actionsFromHome']} hasta bloqueo" if j['status']!='ui-working' else str(r['stepsToCompletion'])
        label=j['goal']+(f" (*{j['variant']}*)" if j['variant'] else '')
        label=label.replace('|','\\|')
        md.append(f"| `{j['id']}` | {label} | {', '.join(j['requirements'])} | {labels[j['status']]} | {steps} |")
    md.append('')
md+=['## Límite del método','',
     'Los recorridos se ejecutan en la UI de muestra con datos sintéticos y un navegador real. No hay llamadas a AWS, OIDC, Cedar, MCP ni servicios de evidencia. La presencia de botones, sus simulaciones y el resultado de una acción en memoria no demuestran autorización ni persistencia del producto final.',
     'Las ausencias se corroboraron contra el código de las vistas, sus acciones y el modelo de estado. Las pruebas de ausencia son detectores de regresión del *inventario de brechas*: no sustituyen pruebas del comportamiento requerido una vez que se implemente.',
     '']
(ROOT/'docs/journey-matrix.md').write_text('\n'.join(md)+'\n')
print('Matrix updated:',len(spec),'flows and',len(md),'lines')
