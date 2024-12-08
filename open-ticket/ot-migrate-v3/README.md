# OT Migrate v3
Use this plugin to migrate all tickets from Open Ticket v3 to v4.

### How does it work?
When you start the bot with this plugin enabled, all tickets which were created in v3 will receive an embed with a button.
When you click that button, it will migrate the old ticket to a new v4 ticket.

### What will happen?
- The ticket message (first message) sent by the bot will be replaced with the new one.
- The bot will create a new temporary `option` for this ticket.
- All roles except the `globalAdmins` will be removed from the ticket.
- Users will stay in the ticket.

### What are the results?
- Because the creator of the ticket is unknown, transcripts might include less details.
- All old admins will be removed from the ticket, but the new global admins will be added back.
- Participants may be inaccurrate.
- Some messages/embeds might be different in layout than expected.
- Some commands could break in this temporary ticket.
- Claimed & closed tickets will be resetted back to normal.
- Old buttons & features from v3 won't work anymore.