現在の git タグ一覧を確認し、次のバージョン番号（semver）を提案してください。
ユーザーが確認したら以下を実行します：

1. `git tag vX.X.X` でタグを作成
2. `git push origin vX.X.X` でプッシュ

GitHub Actions が自動で Windows / macOS ビルドを行い、
リリースに dmapp-vX.X.X-windows.zip と dmapp-vX.X.X-macos.zip をアップロードします。

リリース後、`gh release view vX.X.X --repo pasmanul/dmapp` でアセットが揃っているか確認してください。
