# SVGoify


一个适用于前端的 svg 压缩、编辑工具


### 安装依赖

```shell
npm i
```

### 启动

```shell
npm run start
```

### 打包

生成可执行文件

```shell
npm run package
```

### 制作

根据 “生成可执行文件” 生成可分发文件，`npm run make` 包含了 `npm run package`

```shell
npm run make
```

### 分发


将安装程序分发到 GitHub 等平台（不在本地运行）

```shell
npm run publish
```

### Version

```text
patch: 1.0.0 -> 1.0.1

minor: 1.0.0 -> 1.1.0

major: 1.0.0 -> 2.0.0
```

### changelog

```shell
git log --format=%B%n-hash-%n%H%n-gitTags-%n%d%n-committerDate-%n%ci%n-authorName-%n%an%n-authorEmail-%n%ae%n v1.0.0 --no-merges    
```
