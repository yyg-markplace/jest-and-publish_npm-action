const { GitHub, context } = require("@actions/github");
const exec = require('@actions/exec');
const fs = require("fs")
const core = require('@actions/core');
const childProcess = require('child_process')

let start_time = new Date().getTime()

//当 jest 安装好了之后 ,读取 jest 测试的结果文件
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
            //测试成功之后, 使用多进程发布到 npm-github
            let p_npm_publish = childProcess.exec("npm publish")
            p_npm_publish.on('exit', (code) => {
                if (!(code)) {
                    //code == 0 表示正常退出
                    console.log("====== 发布成功 ====== ")
                }else{
                    console.log(" ====== 发布失败 ======")
                }
            })
        } else {
            console.log("jest 测试失败")
            //看看直接打印错误行不行
            console.log(data)
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

    //使用时间戳 作为 version的最后一段
    let timestamp = new Date().getTime()
    let version_3 = parseInt(timestamp / 1000)

    let json_obj = {}
    json_obj.scripts = {}
    //name的格式为"@yy-group-invoke-js-action/jest-and-publish_npm-action"
    json_obj.name = "@" + compare_arr[3] + "/" + compare_arr[4]
    json_obj.version = "1.0." + version_3
    json_obj.scripts.test = "jest"
    //使用白名单模式 , 只允许 index.js上传

    json_obj.files = ["index.js"]

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

    // 写入json 和 .npmrc 文件之后, 立即将状态设置为 0 
    write_file_state = 0

    console.log("输出 新的package.json 配置文件");
    console.log(json_obj);
    //console.log(token);
    //console.log(registry);

    //exec.exec('cat', ['package.json']);
    //exec.exec('cat', ['.npmrc']);
}

//使用多线程克隆 js-action 宿主仓库
let git_clone_command = "git clone " + context.payload.repository.git_url
let p_git_clone = childProcess.exec(git_clone_command)

let main = function(){
    //定义全局变量 , 用来不断的定时刷新(超过 300 毫秒就判断一次) , 直到某些变量组合相加等于 0 ,组合值等于 0表示同时满足多个条件 
    let p_install_jest_state = 1
    let p_git_clone_state = 1
    let write_file_state = 1
    let timeout_status = 0
    //初始化 超时标志位 0 ,  当多个进程都返回 0 的时候 , 进入循环中 , 然后立即将循环体重的超时标志设为 1 ,防止多次运行

    //使用多线程去全局安装 jest
    let p_install_jest = childProcess.exec("sudo npm install -g jest")

    

    //回调函数,  正常退出返回代码 0 
    p_install_jest.on('exit', (code) => {
        p_install_jest_state = code
        //let time_end_jest = new Date().getTime()
        //console.log("安装 jest 结束");
        //console.log(time_end_jest - start_time)
    })
    p_git_clone.on('exit', (code) => {
        p_git_clone_state = code
        //let time_end_clone = new Date().getTime()
        //console.log("克隆线程结束");
        //console.log(time_end_clone - start_time)
        write_config_file()

    })

    let time = setInterval(function () {
        /*
        if (!(p_install_jest_state + p_git_clone_state + write_file_state + timeout_status)) {
            // 进入循环之后, 立即将超时标志设为 1 , 是if 中的表达式为 0 ,就不会再次执行这段逻辑了
            timeout_status = 1
    
            console.log("已经安装 jest , 克隆宿主仓库 , 新建 package.json 完成")
            console.log("在循环体中运行多线程 , 多进程调用 jest 命令测试")
            let p_run_jest = childProcess.exec('jest --json --outputFile jest-result.json')
            p_run_jest.on('exit', (code) => {
                if (!(code)) {
                    //code == 0 表示正常退出
                    //使用一个函数来分析测试结果
                    run_jest_output_result()
                }
            })
    
            //这一个异步执行完毕之后, 就删除这个循环定时器
            clearInterval(time)
        }
        */
       console.log("install jest == "+ p_install_jest_state)
       console.log("clone ==" + p_git_clone_state);
       console.log("write_file == " + write_file_state)
       
       
       
       

    }, 3000)
    
    let outtime = setTimeout(function(){
        clearInterval(time)
    } , 50*1000)
}



main()

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