exports.types = [
    {name: 'app', desc: '应用'},
    {name: 'module', desc: '功能模块'},
    {name: 'extend', desc: '应用拓展'}
]

exports.groups = [
    {name: '', desc: '无分组'},
    {name: 'apps', desc: '应用模块'},
    {name: 'base', desc: '基础模块'},
    {name: 'spi', desc: 'SPI模块'},
    {name: 'thirdparty', desc: '第三方插件'}
]

exports.groupsPlain = exports.groups.map(function (o, index) {
    return {
        name: o.name + ' (' + o.desc + ')',
        value: o.name,
        short: index
    }
});

exports.typesPlain = exports.types.map(function (o, index) {
    return {
        name: o.name + ' (' + o.desc + ')',
        value: o.name,
        short: index
    }
});

exports.addons = [
    {
        name: '基础框架(必选)-jm-ping',
        value: "jm-ping",
        Ref: 'jimo-public',
        Group: 'base',
        SourceType: 'git',
        Source: '',
        Description: '用于测试服务器是否可 ping',
        Type: 'module',
        DependOns: 'none',
        Conflicts: 'none',
        Migrations: 'migrations',
        Docs: 'docs',
        DataSources: 'none',
        checked: true
    }
];
