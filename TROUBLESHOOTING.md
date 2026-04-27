# Troubleshooting de rollback visual (Windows + PowerShell)

Se você recebeu erro ao rodar `rm -rf ...` no PowerShell, isso é esperado: esse comando é de shell Unix (bash/zsh).

## Comandos equivalentes no PowerShell

```powershell
# Limpa dependências e builds comuns de front-end
Remove-Item -Recurse -Force node_modules,dist,build,.next,.vite -ErrorAction SilentlyContinue

# Reinstala dependências e sobe o projeto
npm install
npm run dev
```

## Sequência recomendada para reset limpo

```powershell
git checkout main
git reset --hard <SHA_DO_COMMIT_BOM>
git clean -fd
Remove-Item -Recurse -Force node_modules,dist,build,.next,.vite -ErrorAction SilentlyContinue
npm install
npm run dev
```

## Se o visual ainda não voltou

1. Confirme o commit atual:

```powershell
git rev-parse --short HEAD
git log --oneline -n 5
```

2. Limpe cache no navegador:
- Hard refresh (`Ctrl + F5`)
- Aba anônima
- DevTools → Application → Clear storage

3. Confirme que você abriu a pasta certa do projeto.
