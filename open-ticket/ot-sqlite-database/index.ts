import {api, openticket, utilities} from "#opendiscord"
import * as discord from "discord.js"
import * as sqlite from "sqlite3"
if (utilities.project != "openticket") throw new api.ODPluginError("This plugin only works in Open Ticket!")

//DECLARATION
class OTSQLiteDatabaseConfig extends api.ODJsonConfig {
    declare data: {
        migrateFromJson:boolean,
        migrateToJson:boolean,
    }
}
declare module "#opendiscord-types" {
    export interface ODPluginManagerIds_Default {
        "ot-sqlite-database":api.ODPlugin
    }
    export interface ODConfigManagerIds_Default {
        "ot-sqlite-database:config": OTSQLiteDatabaseConfig
    }
    export interface ODCheckerManagerIds_Default {
        "ot-sqlite-database:config": api.ODChecker
    }
    export interface ODPluginClassManagerIds_Default {
        "ot-sqlite-database:manager": ODSqliteManager
    }
}

//REGISTER CONFIG
openticket.events.get("onConfigLoad").listen((configs) => {
    configs.add(new OTSQLiteDatabaseConfig("ot-sqlite-database:config","config.json","./plugins/ot-sqlite-database/"))
})

//REGISTER CONFIG CHECKER
openticket.events.get("onCheckerLoad").listen((checkers) => {
    const config = openticket.configs.get("ot-sqlite-database:config")
    const structure = new api.ODCheckerObjectStructure("ot-sqlite-database:config",{children:[
        {key:"migrateFromJson",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-feedback:migrate-from-json",{})},
        {key:"migrateToJson",optional:false,priority:0,checker:new api.ODCheckerBooleanStructure("ot-feedback:migrate-to-json",{})},
    ]})
    checkers.add(new api.ODChecker("ot-sqlite-database:config",checkers.storage,0,config,structure))
})

//SQLITE MANAGER
export class ODSqliteManager extends api.ODManagerData {
    database: sqlite.Database
    file: string
    #tables: string[] = []

    constructor(id:api.ODValidId,file:string){
        super(id)
        this.file = file
        this.database = new sqlite.Database(file,(err) => {
            if (err) throw new api.ODPluginError("Failed to init SQLite database! err:"+err)
        })
    }

    /**Add a new table to the database. */
    async addTable(name:string){
        this.#tables.push(name)
        return new Promise<void>((resolve,reject) => {
            this.database.serialize(() => {
                this.database.prepare("CREATE TABLE IF NOT EXISTS "+name+" (category TEXT NOT NULL, key TEXT NOT NULL, value TEXT)").run((err) => {
                    if (err) reject(err)
                    else resolve()
                })
            })
        })
    }
    /**Remove a table from the database. */
    async removeTable(name:string){
        const i = this.#tables.findIndex((v) => v == name)
        if (i > -1) this.#tables.splice(i,1)
        
        return new Promise<void>((resolve,reject) => {
            this.database.serialize(() => {
                this.database.prepare("DROP TABLE IF EXISTS "+name).run((err) => {
                    if (err) reject(err)
                    else resolve()
                })
            })
        })
    }
    /**Get a single value by category & key. */
    async getValue(table:string,category:string,key:string){
        const i = this.#tables.findIndex((v) => v == table)
        if (i < 0) throw new api.ODPluginError("ODSqliteManager.getValue() => Unknown Table!")
        
        return new Promise<string|null>((resolve,reject) => {
            this.database.prepare("SELECT value FROM "+table+" WHERE category=? AND key=?",category,key).get((err,row:{value:string}|undefined) => {
                if (err) reject(err)
                else resolve(row?.value ?? null)
            })
        })
    }
    /**Set a value by category, key & value. */
    async setValue(table:string,category:string,key:string,value:string){
        const i = this.#tables.findIndex((v) => v == table)
        if (i < 0) throw new api.ODPluginError("ODSqliteManager.setValue() => Unknown Table!")
        
        const currentValue = await this.getValue(table,category,key)
        if (currentValue === null){
            //doesn't exist yet
            return new Promise<boolean>((resolve,reject) => {
                this.database.serialize(() => {
                    this.database.prepare("INSERT INTO "+table+" VALUES (?,?,?)",category,key,value).run((err) => {
                        if (err) reject(err)
                        else resolve(false)
                    })
                })
            })
        }else{
            //already exists
            return new Promise<boolean>((resolve,reject) => {
                this.database.prepare("UPDATE "+table+" SET value = ? WHERE category=? AND key=?",value,category,key).run((err) => {
                    if (err) reject(err)
                    else resolve(true)
                })
            })
        }
    }
    /**Delete a value by category & key. */
    async deleteValue(table:string,category:string,key:string){
        const i = this.#tables.findIndex((v) => v == table)
        if (i < 0) throw new api.ODPluginError("ODSqliteManager.deleteValue() => Unknown Table!")
        
        return new Promise<void>((resolve,reject) => {
            this.database.serialize(() => {
                this.database.prepare("DELETE FROM "+table+" WHERE category=? AND key=?",category,key).run((err) => {
                    if (err) reject(err)
                    else resolve()
                })
            })
        })
    }
    /**Check if a value exists by category & key. */
    async existsValue(table:string,category:string,key:string){
        const value = await this.getValue(table,category,key)
        return (value !== null)
    }
    /**Get all values from a category. */
    async getCategory(table:string,category:string){
        const i = this.#tables.findIndex((v) => v == table)
        if (i < 0) throw new api.ODPluginError("ODSqliteManager.getCategory() => Unknown Table!")
        
        return new Promise<{key:string,value:string}[]|null>((resolve,reject) => {
            this.database.prepare("SELECT key,value FROM "+table+" WHERE category=?",category).all((err,row:{key:string,value:string}[]|undefined) => {
                if (err) reject(err)
                else resolve(row ?? null)
            })
        })
    }
    /**Get all values from a table. */
    async getAll(table:string){
        const i = this.#tables.findIndex((v) => v == table)
        if (i < 0) throw new api.ODPluginError("ODSqliteManager.getAll() => Unknown Table!")
        
        return new Promise<{category:string,key:string,value:string}[]|null>((resolve,reject) => {
            this.database.prepare("SELECT category,key,value FROM "+table).all((err,row:{category:string,key:string,value:string}[]|undefined) => {
                if (err) reject(err)
                else resolve(row ?? null)
            })
        })
    }
}

//SQLITE DATABASE
export class ODSQLiteDatabase extends api.ODDatabase {
    sqlite: ODSqliteManager
    table: string

    constructor(id:api.ODValidId,name:string,sqlite:ODSqliteManager){
        super(id)
        this.sqlite = sqlite
        this.path = sqlite.file
        this.file = sqlite.file.split("/").at(-1) ?? ""
        this.table = name
    }

    /**Init the database. */
    async init(): Promise<void> {
        await this.sqlite.addTable(this.table)
    }
    /**Add/Overwrite a specific category & key in the database. Returns `true` when overwritten. */
    async set(category:string, key:string, value:api.ODValidJsonType): Promise<boolean> {
        return (await this.sqlite.setValue(this.table,category,key,JSON.stringify(value)))
    }
    /**Get a specific category & key in the database */
    async get(category:string, key:string): Promise<api.ODValidJsonType|undefined> {
        const rawResult = await this.sqlite.getValue(this.table,category,key)
        if (rawResult === null) return undefined
        else return JSON.parse(rawResult)
    }
    /**Delete a specific category & key in the database */
    async delete(category:string, key:string): Promise<boolean> {
        await this.sqlite.deleteValue(this.table,category,key)
        return true
    }
    /**Check if a specific category & key exists in the database */
    async exists(category:string, key:string): Promise<boolean> {
        return (await this.sqlite.existsValue(this.table,category,key))
    }
    /**Get a specific category in the database */
    async getCategory(category:string): Promise<{key:string, value:api.ODValidJsonType}[]|undefined> {
        const rawResult = await this.sqlite.getCategory(this.table,category)
        if (rawResult === null) return undefined
        else return rawResult.map((r) => {
            return {key:r.key,value:JSON.parse(r.value)}
        })
    }
    /**Get all values in the database */
    async getAll(): Promise<api.ODJsonDatabaseStructure> {
        const rawResult = await this.sqlite.getAll(this.table)
        if (rawResult === null) return []
        else return rawResult.map((r) => {
            return {category:r.category,key:r.key,value:JSON.parse(r.value)}
        })
    }
}

//CREATE SQLITE DATABASE MANAGER
openticket.events.get("onDatabaseLoad").listen(() => {
    const devconfigFlag = openticket.flags.get("openticket:dev-database")
    const isDevconfig = devconfigFlag ? devconfigFlag.value : false
    openticket.plugins.classes.add(new ODSqliteManager("ot-sqlite-database:manager",isDevconfig ? "./devdatabase/openticket.sqlite" : "./database/openticket.sqlite"))
})

//REPLACE ALL DATABASES WITH SQLITE VARIANT
const oldDatabases: api.ODDatabase[] = []
openticket.events.get("afterDatabasesLoaded").listen(async (databases) => {
    const sqlite = openticket.plugins.classes.get("ot-sqlite-database:manager")
    
    oldDatabases.push(...databases.getAll())

    oldDatabases.forEach((db) => {
        const name = db.file.replace(".json","")
        databases.add(new ODSQLiteDatabase(db.id,name,sqlite),true)
    })
})

//MIGRATE FROM & TO JSON DATABASE
openticket.events.get("afterDatabasesInitiated").listen(async (databases) => {
    const config = openticket.configs.get("ot-sqlite-database:config")

    if (config.data.migrateFromJson){
        //migrate to sqlite database
        await databases.loopAll(async (database,id) => {
            //get old data
            const oldDb = oldDatabases.find((db) => db.id.value === id.value)
            if (!oldDb) return
            await oldDb.init()
            const oldData = await oldDb.getAll()
            
            for (const d of oldData){
                if (!(await database.exists(d.category,d.key))) await database.set(d.category,d.key,d.value)
                await oldDb.delete(d.category,d.key)
            }
        })
    }else if (config.data.migrateToJson){
        //migrate to json database
        await databases.loopAll(async (database,id) => {
            //get old data
            const oldDb = oldDatabases.find((db) => db.id.value === id.value)
            if (!oldDb) return
            await oldDb.init()
            const newData = await database.getAll()
            
            for (const d of newData){
                if (!(await oldDb.exists(d.category,d.key))) await oldDb.set(d.category,d.key,d.value)
                await database.delete(d.category,d.key)
            }
        })
    }
})