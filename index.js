//const { GitHub, context } = require("@actions/github");
const exec = require('@actions/exec');
const fs = require("fs")
const core = require('@actions/core');



let run = async function(){
    let  repo_token= core.getInput('repo-token');
    console.log(repo_token)
    //await exec.exec('echo', ["abc", "|", "base64" ,">" ,"aa.txt"]);
    //await exec.exec('echo', ["abc", "|", "base64" ]);
    //await exec.exec('cat', ["aa.txt"]);
   
    //await exec.exec('echo',[ 'abc|base64'] );

    console.log("base64加密执行完毕")



   /*
    console.log("准备 git 检出")
    await exec.exec('git', ['clone', context.payload.repository.git_url]);
    console.log("git 检出 完毕")

    console.log("准备再次 执行 ls")
    await exec.exec('ls');

    console.log("准备全局安装 jest")
    await exec.exec('npm', ['i', '-g' , 'jest']);
    console.log("jest安装完毕")

    console.log("准备jest测试")
    await exec.exec('jest', ['--json', '--outputFile' , 'jest-result.json']);
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
*/

    console.log("jest测试结束 , 并将结果输出在jest-result.json文件中")
  }
  
  run ()