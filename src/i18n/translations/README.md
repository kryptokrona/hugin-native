# Translation Files

This directory contains JSON translation files for Hugin Messenger.

## Adding a New Language

1. Copy `en.json` to a new file named with your language code, e.g., `fr.json` for French.

2. Translate the values on the right side of the key-value pairs.

3. Import your new language file in `src/i18ntjs.ts` and add it to the `resources` object.

4. Submit a pull request with your translation and your XKR address for bounty.

## Notes

- Only human-written translations are accepted.

- AI-generated translations are limited to 10% of the content.

- Use the ISO 639-1 language codes for naming files.

- See the issue #13 on GitHub for more details.
