const archiver = require("archiver")
const fs = require("fs")
const path = require("path")

const plugins = fs.readdirSync("./open-ticket").filter((p) => p != ".DS_Store")
for (const plugin of plugins){
    //remove existing zip files
    if (fs.existsSync("./open-ticket/"+plugin+"/"+plugin+".zip")) fs.rmSync("./open-ticket/"+plugin+"/"+plugin+".zip")
}
if (!fs.existsSync("./temp-open-ticket/")) fs.mkdirSync("./temp-open-ticket/")
console.log("Removed old zip files!")

setTimeout(() => {
    let counter = 0
    for (const plugin of plugins){
        //create zip file stream
        const output = fs.createWriteStream(path.join(process.cwd(),"./temp-open-ticket/"+plugin+".zip"))
        const archive = archiver("zip",{zlib:{level:9}})
        
        //error handling
        output.on("close",() => {
            console.log("wrote "+archive.pointer()+" bytes for plugin: "+plugin)
            fs.copyFileSync("./temp-open-ticket/"+plugin+".zip","./open-ticket/"+plugin+"/"+plugin+".zip")
            counter++

            if (counter == plugins.length){
                fs.rmSync("./temp-open-ticket/",{force:true,recursive:true})
                console.log("Finished!")
            }
        })
        archive.on("warning",(err) => {
        console.log(err)
        })
        archive.on("error",(err) => {
            throw err
        })

        //pipe zip archive to output file
        archive.pipe(output)

        //append files
        archive.directory(path.join(process.cwd(),"./open-ticket/"+plugin+"/"),false)
        archive.finalize()
    }
},1000)