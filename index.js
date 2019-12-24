const { GitHub, context } = require("@actions/github");
const exec = require('@actions/exec');
const fs = require("fs")
const core = require('@actions/core');
const childProcess = require('child_process')



let run_jest_output_result = async function () {

    ////await exec.exec('cat', [ 'package.json']);
    // 本来是用 同步运行命令是醉了方便的 ,但是,同步运行 jest 命令 ,会输出多余的结果 ,为了避免干扰 , 使用多线程 ,这样不会输出额外的结果

    console.log("读取 json 文件,查看 jest 测试结果")
    fs.readFile('jest-result.json', function (err, data) {
        if (err) {
            return console.error(err);
        }
        //先将 data 转换成字符串 , 然后用 json反序列化
        let jest_result = JSON.parse(data.toString())

        if (jest_result.success) {
            console.log("jest 测试成功")
            exec.exec('npm', ['publish']);
        } else {
            console.log("jest 测试失败")
        }
    })
}

let write_config_file =  function () {

    //获取宿主 action 传递过来的项目访问你安排
    let repo_token = core.getInput('repo-token');

    //打印 github 项目的上下文
    //console.log(context);

    //需要 组织名称 ,和项目名称 , 都在 compare 这个字段中
    let compare_arr = context.payload.compare.split("/")

    let timestamp = new Date().getTime()
    let version_3 = parseInt(timestamp / 1000)

    let json_obj = {}
    json_obj.scripts = {}
    //name的格式为"@yy-group-invoke-js-action/jest-and-publish_npm-action"
    json_obj.name = "@" + compare_arr[3] + "/" + compare_arr[4]
    json_obj.version = "1.0." + version_3
    json_obj.scripts.test = "jest"


    var json_str = JSON.stringify(json_obj);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
    fs.writeFileSync('package.json', json_str, function (err) {
        if (err) {
            console.error(err);
        }
    })

    let token = "//npm.pkg.github.com/:_authToken=" + repo_token
    let registry = "registry=https://npm.pkg.github.com/" + compare_arr[3]
    let npmrc_str = token + "\n" + registry
    fs.writeFileSync('.npmrc', npmrc_str, function (err) {
        if (err) {
            console.error(err);
        }
    })

    //console.log(json_obj);
    //console.log(token);
    //console.log(registry);

    //exec.exec('cat', ['package.json']);
    //exec.exec('cat', ['.npmrc']);
    //await exec.exec('npm', ['publish']);
    write_file_state = 0
}

//定义全局变量 , 用来不断的定时刷新(超过 300 毫秒就判断一次) , 直到某些变量组合相加等于 0 ,组合值等于 0表示同时满足多个条件 
let p_install_jest_state = 1
let p_git_clone_state = 1
let write_file_state = 1
let timeout_status = 0
//初始化 超时标志位 0 ,  当多个进程都返回 0 的时候 , 进入循环中 , 然后立即将循环体重的超时标志设为 1 ,防止多次运行


//使用多线程去全局安装 jest
let p_install_jest = childProcess.exec("sudo npm install -g jest")

//使用多线程克隆 js-action 宿主仓库
let git_clone_command = "git clone " + context.payload.repository.git_url
let p_git_clone = childProcess.exec(git_clone_command)

//在主线程执行 写入 package.json 和 npmrc
write_config_file()
//jest 命令需要package.json 文件 ,  临时安装一下 
// 注意: 对于 json 格式需要 python 工具格式化 , 不然 echo 总是错误
////let package_contain = `echo '{"scripts":{"test":"jest"}}'|python -m json.tool > package.json`
////let p_generate_package = childProcess.exec(package_contain)

////运行 jest 命令  jest 命令需要等着 3 个条件都满足了才能运行 , 将这个多线程的定义放在循环体中
//// let p_run_jest = childProcess.exec( 'jest --json --outputFile jest-result.json')

//还有一个创建 npmrc 文件使用 多进程生成文件


//回调函数,  正常退出返回代码 0 
p_install_jest.on('exit', (code) => {
    p_install_jest_state = code
})
p_git_clone.on('exit', (code) => {
    p_git_clone_state = code
})

//p_generate_package.on('exit', (code) => {
 //   result_p_generate_package = code
//})


let time = setInterval(function () {
    if (!(p_install_jest_state + p_git_clone_state + write_file_state + timeout_status)) {
        // 进入循环之后, 立即将超时标志设为 1 , 是if 中的表达式为 0 ,就不会再次执行这段逻辑了
        timeout_status = 1

        console.log("已经安装 jest , 克隆宿主仓库 , 新建 package.json 完成")
        console.log("在循环体中运行多线程 , 多进程调用 jest 命令测试")
        let p_run_jest = childProcess.exec('jest --json --outputFile jest-result.json')
        p_run_jest.on('exit', (code) => {
            if (!(code)) {
                //code == 0 表示正常退出
                run_jest_output_result()
            }
            //run_jest_output_result ()
        })

        //这一个异步执行完毕之后, 就删除这个循环定时器
        clearInterval(time)
    }
}, 300)


/*

let run = async function(){



    console.log("准备 git 检出")
    await exec.exec('git', ['clone', context.payload.repository.git_url]);
    console.log("git 检出 完毕")

    console.log("准备再次 执行 ls")
    await exec.exec('ls');

    //console.log("准备全局安装 jest")
    //await exec.exec('sudo', ['npm','install', '-g' , 'jest']);
    //console.log("jest安装完毕")

    console.log("准备jest测试")
    //await exec.exec('jest', ['--json', '--outputFile' , 'jest-result.json']);


    await exec.exec('jest', [ '--json','--outputFile' , 'jest-result.json']);
    console.log("jest测试结束 , 并将结果输出在jest-result.json文件中")

    console.log("读取 json 文件,查看 jest 测试结果")
    fs.readFile('jest-result.json',function(err,data){
        if(err){
            return console.error(err);
        }
        //先将 data 转换成字符串 , 然后用 json反序列化
        let jest_result=JSON.parse( data.toString())

        if(jest_result.success){
            console.log("jest 测试成功")
        } else{
            console.log("jest 测试失败")
        }
    })

    console.log("jest测试结束 , 并将结果输出在jest-result.json文件中")
  }

  //run ()
  */