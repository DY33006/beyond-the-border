"""Package the editable project and a double-clickable offline preview."""
from pathlib import Path
import argparse,json,zipfile
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('output');args=parser.parse_args()
output=Path(args.output).resolve();output.parent.mkdir(parents=True,exist_ok=True)
html=(ROOT/'dist/index.html').read_text()
css=(ROOT/'dist/styles.css').read_text();js=(ROOT/'dist/app.js').read_text()
embedded=''
for name in ['comparison','history','evidence']:
    value=(ROOT/'dist/data'/f'{name}.json').read_text().replace('<','\\u003c')
    embedded+=f'<script type="application/json" id="embedded-{name}">{value}</script>'
# Export links also work when the bundled preview is opened without a server.
exports={name:(ROOT/'dist/data'/name).read_text() for name in ['country-scores-2022.csv','audit.json','evidence.json']}
download_js='const exports='+json.dumps(exports).replace('<','\\u003c')+';document.querySelectorAll("a[download]").forEach(a=>{const name=a.getAttribute("href").split("/").pop();if(exports[name]){a.href=URL.createObjectURL(new Blob([exports[name]],{type:name.endsWith("csv")?"text/csv":"application/json"}));a.download=name}});'
html=html.replace('<link rel="stylesheet" href="styles.css">',f'<style>{css}</style>').replace('<script type="module" src="app.js"></script>','')
html=html.replace('</body>',embedded+'<script type="module">'+js+'\n'+download_js+'</script></body>')
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(ROOT.rglob('*')):
        if not p.is_file() or any(part in ('.git','node_modules','.vercel','__pycache__','artifacts') for part in p.relative_to(ROOT).parts) or p.name.startswith('__qa_'):continue
        z.write(p,'Beyond_the_Border/'+str(p.relative_to(ROOT)))
    z.writestr('Beyond_the_Border/OPEN_ME.html',html)
    z.writestr('Beyond_the_Border/START_HERE.txt','Double-click OPEN_ME.html for the working preview. Read README.md for collaboration and deployment. Edit files in dist/; regenerate OPEN_ME.html using scripts/package_source.py. Numerical processing lives in scripts/prepare_data.py.\n')
print(f'{output} ({output.stat().st_size:,} bytes)')
