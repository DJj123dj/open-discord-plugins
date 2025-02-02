import { opendiscord, api, utilities } from "#opendiscord"
import * as discord from "discord.js"

/**## ODReminderManager `class`
 * This is an OD Reminders manager.
 * 
 * This class manages all registered reminders in the bot. Only reminders which are available in this manager can be auto-updated.
 * 
 * All reminders which are added, removed or modified in this manager will be updated automatically in the database.
 */
export class ODReminderManager extends api.ODManager<ODReminder> {
    id: api.ODId = new api.ODId("od-reminders:manager")
    // Track scheduled reminders timeouts/intervals
    static scheduledReminders = new Map<api.ODValidId,{timeout: NodeJS.Timeout, interval: NodeJS.Timeout | null}>()

    constructor(debug: api.ODDebugger) {
        super(debug, "reminder")
    }
}

/**## ODReminderDataJson `interface`
 * The JSON representatation from a single reminder property.
 */
export interface ODReminderDataJson {
    /**The id of this property. */
    id:string,
    /**The value of this property. */
    value:api.ODValidJsonType
}

/**## ODReminderDataJson `interface`
 * The JSON representatation from a single reminder.
 */
export interface ODReminderJson {
    /**The id of this reminder. */
    id:string,
    /**The version of Open Ticket used to create this reminder & store it in the database. */
    version:string,
    /**The full list of properties/variables related to this reminder. */
    data:ODReminderDataJson[]
}

/**## ODReminderIds `type`
 * This interface is a list of ids available in the `ODReminder` class.
 * It's used to generate typescript declarations for this class.
 */
export interface ODReminderIds {
    "od-reminders:channel":ODReminderData<string>,
    "od-reminders:text":ODReminderData<string>,
    "od-reminders:embed-color":ODReminderData<discord.ColorResolvable>,
    "od-reminders:embed-title":ODReminderData<string|null>,
    "od-reminders:embed-description":ODReminderData<string|null>,
    "od-reminders:embed-footer":ODReminderData<string|null>,
    "od-reminders:embed-author":ODReminderData<string|null>,
    "od-reminders:embed-timestamp":ODReminderData<boolean|null>,
    "od-reminders:embed-image":ODReminderData<string|null>,
    "od-reminders:embed-thumbnail":ODReminderData<string|null>,
    "od-reminders:author-image":ODReminderData<string|null>,
    "od-reminders:footer-image":ODReminderData<string|null>,
    "od-reminders:ping":ODReminderData<string|null>,
    "od-reminders:startTime":ODReminderData<string>,
    "od-reminders:interval":ODReminderData<{value:number,unit:"seconds"|"minutes"|"hours"|"days"|"months"|"years"}>,
    "od-reminders:paused":ODReminderData<boolean>
}

/**## ODReminder `class`
 * This is an OD Reminders plugin reminder.
 * 
 * This class contains all data related to this reminder (parsed from the database).
 */
export class ODReminder extends api.ODManager<ODReminderData<api.ODValidJsonType>> {
    /**The id of this reminder */
    id:api.ODId

    constructor(id:api.ODValidId, data:ODReminderData<api.ODValidJsonType>[]){
        super()
        this.id = new api.ODId(id)
        data.forEach((data) => {
            this.add(data)
        })
    }

    /**Convert this reminder to a JSON object for storing this reminder in the database. */
    toJson(version:api.ODVersion): ODReminderJson {
        const data = this.getAll().map((data) => {
            return {
                id:data.id.toString(),
                value:data.value
            }
        })
        
        return {
            id:this.id.toString(),
            version:version.toString(),
            data
        }
    }

    /**Create a reminder from a JSON object in the database. */
    static fromJson(json:ODReminderJson): ODReminder {
        return new ODReminder(json.id,json.data.map((data) => new ODReminderData(data.id,data.value)))
    }

    get<ReminderId extends keyof ODReminderIds>(id:ReminderId): ODReminderIds[ReminderId]
    get(id:api.ODValidId): ODReminderData<api.ODValidJsonType>|null
    
    get(id:api.ODValidId): ODReminderData<api.ODValidJsonType>|null {
        return super.get(id)
    }

    remove<ReminderId extends keyof ODReminderIds>(id:ReminderId): ODReminderIds[ReminderId]
    remove(id:api.ODValidId): ODReminderData<api.ODValidJsonType>|null
    
    remove(id:api.ODValidId): ODReminderData<api.ODValidJsonType>|null {
        return super.remove(id)
    }

    exists(id:keyof ODReminderIds): boolean
    exists(id:api.ODValidId): boolean
    
    exists(id:api.ODValidId): boolean {
        return super.exists(id)
    }

    schedule() {
        const paused = this.get("od-reminders:paused").value
        if (paused) return // skip if paused

        const now = new Date();
        const rawInterval = this.get("od-reminders:interval").value
        const interval = this.convertTime(rawInterval.value, rawInterval.unit)
        let startOffset = 0;
        const rawStartTime = this.get("od-reminders:startTime").value
        if(rawStartTime !== "now") {
            const startTime = this.parseDate(rawStartTime)
            //calculate startOffset based on startTime and interval (if needed) to start at the correct time
            const diff = startTime.getTime() - now.getTime()
            if (diff > 0) {
                startOffset = diff
            } else {
                startOffset = Math.max(0, interval + diff);
            }
        }
        
        const timeout = setTimeout(() => {
            //send message and set interval
            this.send()
            const intervalId = setInterval(() => {
                if (!paused) this.send()
            }, interval)
            ODReminderManager.scheduledReminders.set(this.id, {timeout, interval: intervalId})
        }, startOffset)
        ODReminderManager.scheduledReminders.set(this.id, {timeout, interval: null})
    }

    // Utility to parse date string with format "DD/MM/YYYY HH:MM:SS"
    private parseDate(dateString: string): Date {
        const [datePart, timePart] = dateString.split(' '); // Split date and time
        const [day, month, year] = datePart.split('/').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);

        //check if date params are valid
        if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2025 || hours < 0 || hours > 24 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
            return new Date();
        }

        return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    // Utility to convert time to milliseconds
    private convertTime(value: number, unit: "seconds"|"minutes"|"hours"|"days"|"months"|"years") {
        switch (unit) {
            case "seconds":
                return value * 1000
            case "minutes":
                return value * 1000 * 60
            case "hours":
                return value * 1000 * 60 * 60
            case "days":
                return value * 1000 * 60 * 60 * 24
            case "months":
                return value * 1000 * 60 * 60 * 24 * 30
            case "years":
                return value * 1000 * 60 * 60 * 24 * 365
        }
    }

    // Send the reminder to the channel
    async send() {
        try {
            const guild = opendiscord.client.mainServer
            if (!guild) return
            const channel = await opendiscord.client.fetchGuildTextChannel(guild, this.get("od-reminders:channel").value)
            if (!channel) return
            await channel.send((await opendiscord.builders.messages.get("od-reminders:reminder-message").build("other",{reminder:this})).message)
            this.get("od-reminders:startTime").value = utilities.dateString(new Date())
        } catch (err) {
            opendiscord.log("Error sending reminder: " + (err as Error).message, "error")
        }
    }
}

/**## ODReminderData `class`
 * This is OD Reminders plugin Reminder data.
 * 
 * This class contains a single property for a Reminder. (string, number, boolean, object, array, null)
 * 
 * When this property is edited, the database will be updated automatically.
 */
export class ODReminderData<DataType extends api.ODValidJsonType> extends api.ODManagerData {
    /**The value of this property. */
    #value: DataType

    constructor(id:api.ODValidId, value:DataType){
        super(id)
        this.#value = value
    }

    /**The value of this property. */
    set value(value:DataType){
        this.#value = value
        this._change()
    }
    get value(): DataType {
        return this.#value
    }
    /**Refresh the database. Is only required to be used when updating `ODReminderData` with an object/array as value. */
    refreshDatabase(){
        this._change()
    }
}