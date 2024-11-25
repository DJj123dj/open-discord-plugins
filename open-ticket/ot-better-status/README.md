# OT Better Status
An advanced status plugin to switch between bot statuses. It also allows for the use of variables and more!

> You can find available config variables in the `VARIABLES.txt` file!

### Example Config
```json
{
    "stateSwitchDelaySeconds":10,
    "states":[
        {
            "type":"custom",
            "text":"Server Size: {user-count}",
            "status":"online"
        },
        {
            "type":"watching",
            "text":"{ticket-count} tickets",
            "status":"online"
        },
        {
            "type":"custom",
            "text":"Online for {uptime-minutes} minutes",
            "status":"idle"
        }
    ],
    "_VAR_INFO":"Check all available variables in the 'VARIABLES.txt' file!",
    "variables":[
        {
            "name":"{user-count}",
            "variable":"guild.members.all"
        },
        {
            "name":"{ticket-count}",
            "variable":"system.tickets"
        },
        {
            "name":"{uptime-minutes}",
            "variable":"system.uptime.minutes"
        }
    ]
}
```