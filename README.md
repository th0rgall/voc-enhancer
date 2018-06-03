# Voc.com adder

This browser extension for Firefox/Chrome allows [vocabulary.com](https://www.vocabulary.com/) users to add selected words to their vocabulary lists from any website.

## Installation

Instructions at the [releases page](https://github.com/th0rgall/voc-adder/releases).

## Basic usage

Make sure that your browser has been logged in into vocabulary.com once.

Select a word or range of words on any website, right click, and you'll be able to:
- Start learning the selected word(s)
- Add the word(s) to one of your lists (they will appear in a dropdown menu)
- Add the word(s) to a new list.

## Vocabulary lists with examples & descriptions

The plugin can detect words, descriptions and examples in a text selection. This serves as a more flexible alternative for vocabulary.com's 'Edit as a List' feature.

### Separating words

Words are separated by spaces, newlines or commas. Words with multiple parts should be *single* quoted. 

Example 1: running the plugin on

```
these 'are some' very, complicated 
words
```
will result in the words `['these', 'are some', 'very', 'complicated', 'words']`.

### Descriptions & Examples

When written in a specific format, the plugin can extract descriptions and examples, as used in vocabulary.com.

Descriptions start with a dash ` - ` and end with a comma `,`. Words containing a `-` should be *single* quoted.

Example sentences are *double* quoted and put directly after the word they exemplify.

Example 2: putting it all together. Running the plugin on:

```
extirpation - What a creepy word, "She extirpated the carrot."
modulation - of signals, conflagration baguette "Baguette, one of those French words." 
'Hocus pocus' - wizardry, 'tik-tak' finale
```
will result in the extraction of:
```
[ { word: 'extirpation',
    description: 'What a creepy word',
    example: 'She extirpated the carrot.' },
  { word: 'modulation' 
    description: 'of signals' },
  { word: 'conflagration' },
  { word: 'baguette',
    example: 'Baguette, one of those French words.' },
  { word: 'Hocus pocus', description: 'wizardry' },
  { word: 'tik-tak' },
  { word: 'finale' } ]
 ```
