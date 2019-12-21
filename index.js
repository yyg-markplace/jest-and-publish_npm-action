const { GitHub, context } = require("@actions/github");
const exec = require('@actions/exec');
const fs = require("fs")
const core = require('@actions/core');
const childProcess = require('child_process')

//定义全局变量 , 用来不断的刷新 , 直到某些变量组合相加等于 0  表示同时满足多个条件 , 建议超时 300 毫秒刷新一次
let result_p_install_jest = 1
let result_p_git_clone = 1
let result_p_generate_package = 1
let result_p_run_jest = 1

//使用多线程去全局安装 jest
let p_install_jest = childProcess.exec("sudo npm install -g jest" )

//使用多线程克隆 js-action 宿主仓库
let git_clone_command = "git clone " + context.payload.repository.git_url
let p_git_clone = childProcess.exec(git_clone_command )

//jest 命令需要package.json 文件 ,  临时安装一下
let  package_contain = `echo {"scripts": {"test": "jest"}}`
let p_generate_package = childProcess.exec(package_contain)

//运行 jest 命令
let p_run_jest = childProcess.exec( 'jest --json --outputFile jest-result.json')



//回调函数,  正常退出返回代码 0 
p_install_jest.on('exit', (code) => {
    result_p_install_jest = code
})
p_git_clone.on('exit', (code) => {
    result_p_git_clone = code
})
p_generate_package.on('exit', (code) => {
    result_p_generate_package = code
})
p_run_jest.on('exit', (code) => {
    result_p_run_jest = code
})


let time = setInterval(function(){
    if(!result_p_generate_package){
        exec.exec('ls');
        time.clearInterval()
    }
} , 300)
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