# 积墨开源 java快速开发辅助工具 (Jimoos4j-CLi)

> jimoos4j - Quick Command-Line Interface for Quick Init A Java Maven Project

快速启动一个 积墨开源项目兼容的 java maven 项目


## jimoos4j-cli 安装

### 方法一: npm 安装(推荐)

```bash
npm i -g jimoos4j
```
### 方法二: 源码安装

#### 安装到本地

```bash
yarn run update
```

## 使用 `jimoos4j` 命令行

```bash
jimoos4j -h //查看命令使用
```

```
Usage: jimoos4j [options] [command]

Options:
  -h, --help  output usage information

Commands:
  init        init app project // 初始化项目
  add-addon   init app inner addon
  sync        sync addons // -d 删除addon 更新，-o jm-product 只更新局部模块。
```

```
jimo4j init // 初始化项目 {{demo}}
cd {{demo}}
mvn clean install -Dmaven.test.skip=true
cd starter/api-starter 
mvn spring-boot:run //启动 spring-boot 项目
jimo4j add-addon // 添加项目 {{addonDemo}}
mvn clean install -Dmaven.test.skip=true
//添加 addonDemo 到 starter pom.xml 下
cd starter/api-starter 
mvn spring-boot:run //启动 spring-boot 项目，则 addonDemo 就被加载了。
```

## 目录说明

- `addons` 插件目录
- `addons/@` 内部插件
- `addons/depends` 外部依赖插件
- `starter` 应用入口目录
- `bom` 解决项目依赖关系
- `build-parent` 构建根目录

### Addon 的定义

核心唯一 为 Name@Ref，某个挂载的项目下的插件名称。

属性|描述
------|------
Name |名称
Group | @内的分组支持，若无 请删除Group字段。
Ref |挂载的项目
DependOns |依赖的插件，英文逗号分隔
Conflict|冲突的插件，英文逗号分隔

## 开发指南

### 基于四象建模的设计理念

- 基础数据 - 一般是可复用的模块。例如`course/activity/product`等
- 业务模块 - 一般是连接模块。例如`join/pay`等
- 日志模块 - 日志/流水 为基础数据的伴生，一般为类型配置。
- 统计数据 - 常用的可复用，复用性不高。

### 数据接口驱动开发 Api-Driven Development

- 基础数据的增删改查，基础审计操作。
- 核心业务 动作定义
- 日志流水记录
- 定时器 统计数据/复杂SQL定义
- 外部接口 - 数据Flow接口，例如分享/扫码等

## 参考地址

* [commander 的使用方法](https://github.com/tj/commander.js/)
* [inquirer 的使用方法](https://github.com/SBoudrias/Inquirer.js#readme)

## License

[MIT](LICENSE) &copy; [Jimoos](https://Jimoos.cn)


