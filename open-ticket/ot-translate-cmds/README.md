# OT Translate Commands
Translate all built-in command names, descriptions & options to the user's language settings in the Discord app.

### Contributing
We'll appreciate if you contribute with any language.

New language translations must be added at the `translations.json` file.

### Supported Locales
>The following table lists the locales allowed for translations. **📌 Only these locales can be used!**
>
> |Identifier |Language Name            | Native Name        |
> |-----------|-------------------------|--------------------|
> |da         |Danish                   |Dansk               |
> |de         |German                   |Deutsch             |
> |en-GB      |English, UK              |English, UK         |
> |en-US      |English, US              |English, US         |
> |es-ES      |Spanish                  |Español             |
> |es-419     |Spanish, LATAM           |Español, LATAM      |
> |fi         |Finnish                  |Suomi               |
> |fr         |French                   |Français            |
> |hr         |Croatian                 |Hrvatski            |
> |hu         |Hungarian                |Magyar              |
> |id         |Indonesian               |Bahasa Indonesia    |
> |it         |Italian                  |Italiano            |
> |lt         |Lithuanian               |Lietuviškai         |
> |nl         |Dutch                    |Nederlands          |
> |no         |Norwegian                |Norsk               |
> |pl         |Polish                   |Polski              |
> |pt-BR      |Portuguese, Brazilian    |Português do Brasil |
> |ro         |Romanian, Romania        |Română              |
> |sv-SE      |Swedish                  |Svenska             |
> |vi         |Vietnamese               |Tiếng Việt          |
> |tr         |Turkish                  |Türkçe              |
> |cs         |Czech                    |Čeština             |
> |el         |Greek                    |Ελληνικά            |
> |bg         |Bulgarian                |български           |
> |ru         |Russian                  |Pусский             |
> |uk         |Ukrainian                |Українська          |
> |hi         |Hindi                    |हिन्दी                 |
> |th         |Thai                     |ไทย                 |
> |zh-CN      |Chinese, China           |中文                 |
> |ja         |Japanese                 |日本語               |
> |zh-TW      |Chinese, Taiwan          |繁體中文             |
> |ko         |Korean                   |한국어               |

### Translation Structure
> Each command or option in the configuration file must include `nameTranslations` and `descriptionTranslations` for all supported locales. Below is an example of a command structure:
> 
> #### Example Structure
>  ```json
> {
>     "name": "add",
>     "type": "command",
>     "nameTranslations": {
>         "en-GB": "add",
>         "es-ES": "añadir"
>     },
>     "descriptionTranslations": {
>         "en-GB": "Add a user to a ticket.",
>         "es-ES": "Añade un usuario al tiquet."
>     },
>     "options": [
>         {
>             "name": "user",
>             "type": "string",
>             "nameTranslations": {
>                 "en-GB": "user",
>                 "es-ES": "usuario"
>             },
>             "descriptionTranslations": {
>                 "en-GB": "The user to add to the ticket.",
>                 "es-ES": "El usuario a añadir al tiquet."
>             }
>         }
>     ]
> }
> ```
>
> #### Understanding The Structure
> 
> Each command or option contains fields like:
> 1. **`name`**: **Do not modify.** The identifier of the command or option.
> 2. **`type`**: **Do not modify.** The type of the command or option (e.g., `command`, `subcommand`, `string`, `number`, `boolean`, ...).
> 3. **`nameTranslations`**: 
>    - Sets the command or option name to its translation for each locale.
>    - Example: `"en-GB": "add"` for English.
> 4. **`descriptionTranslations`**:
>    - Sets the command or option description to its translation for each locale.
>    - Example: `"en-GB": "Add a user to a ticket."` for English.

### How to Add a New Locale?
> 
> If you want to add translations for a new locale, follow these steps:
> 
> 1. Check that the locale is in the **Supported Locales** table above.
> 2. Add the new locale ID and the translation on all the `nameTranslations` and `descriptionTranslations` fields.
> 3. Ensure all nested options include translations for the new locale.
> 
> *Do **NOT** modify any other fields like `name` or `type`.*
> 
> #### Example Adddition
> Suppose you want to add French (`fr-FR`):
> 
> Before:
> ```json
> "nameTranslations": {
>     "en-US": "add"
> },
> "descriptionTranslations": {
>     "en-US": "Add a user to a ticket."
> }
> ```
> 
> After:
> ```json
> "nameTranslations": {
>     "en-US": "add",
>     "fr": "ajouter"
> },
> "descriptionTranslations": {
>     "en-US": "Add a user to a ticket.",
>     "fr": "Ajouter un utilisateur à un ticket."
> }
> ```

### Validation
> Before saving the configuration file:
> - Verify that all supported locales are present in `nameTranslations` and `descriptionTranslations`.
> - Ensure there are no typos in the locale keys and they match exactly with the IDs in the **Supported Locales** table above.
> 
> *By following this guide, you can easily add translations to your configuration file while maintaining compatibility with the plugin.*
