/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Script } from '../types/script';

export const SAMPLE_SCRIPTS: Script[] = [
  {
    id: 'sample-phantom-nl',
    userId: 'demo-actor-default',
    title: 'De Schim van de Opera - Acte 1, Scène 3 (Nederlands)',
    characters: ['Erik (Het Spook)', 'Christine Daaé', 'Raoul de Chagny'],
    characterVoices: {
      'Erik (Het Spook)': {
        language: 'nl-NL',
        pitch: 0.85,
        rate: 0.95,
        volume: 1.0,
      },
      'Christine Daaé': {
        language: 'nl-NL',
        pitch: 1.15,
        rate: 1.0,
        volume: 1.0,
      },
      'Raoul de Chagny': {
        language: 'nl-NL',
        pitch: 1.0,
        rate: 1.05,
        volume: 0.95,
      },
    },
    scenes: [
      {
        scene_title: 'Scène 1: De Ondergrondse Spiegel',
        dialogue: [
          {
            line_id: 1,
            character: 'Erik (Het Spook)',
            text: 'Luister naar de muziek van de nacht, Christine. Vrees niet wat je niet begrijpt.',
            stage_directions: 'Verschijnt langzaam uit de schaduw van de spiegel in haar kleedkamer.',
          },
          {
            line_id: 2,
            character: 'Christine Daaé',
            text: 'Wie bent u? Mijn vader beloofde mij een Engel der Muziek... bent u hem werkelijk?',
            stage_directions: 'Stapt achteruit, haar hand rustend op haar hart.',
          },
          {
            line_id: 3,
            character: 'Erik (Het Spook)',
            text: 'Ik ben de stem die je roept in je dromen. Jouw talent behoort nu aan de kunst toe.',
            stage_directions: 'Reikt zijn gehandschoende hand uit.',
          },
          {
            line_id: 4,
            character: 'Raoul de Chagny',
            text: 'Christine! Doe de deur open! Wie praat daar met jou?',
            stage_directions: 'Klopt haastig en bezorgd op de zware eikenhouten deur.',
          },
          {
            line_id: 5,
            character: 'Christine Daaé',
            text: 'Raoul, wacht! Je mag hier nu niet naar binnen gaan. Het lot beslist over mijn stem.',
            stage_directions: 'Draait zich in paniek om tussen de spiegel en de gesloten deur.',
          },
          {
            line_id: 6,
            character: 'Erik (Het Spook)',
            text: 'Laat hem kloppen tot zijn knokkels bloeden. Kom met mij mee naar het donker.',
            stage_directions: 'Trekt de geheime spiegeldeur geruisloos open.',
          },
        ],
      },
      {
        scene_title: 'Scène 2: Aan de Oever van het Ondergrondse Meer',
        dialogue: [
          {
            line_id: 7,
            character: 'Erik (Het Spook)',
            text: 'Hier heerst geen spot van de buitenwereld. Hier zingen wij de waarheid.',
            stage_directions: 'Stuurt de gondel met de lange roeiriem door de dichte mist.',
          },
          {
            line_id: 8,
            character: 'Christine Daaé',
            text: 'Mijn herinnering vervaagt... de geur van wierook en koud water bedwelmt mijn zinnen.',
            stage_directions: 'Kijkt omhoog naar de duizenden flikkerende kaarsen.',
          },
          {
            line_id: 9,
            character: 'Erik (Het Spook)',
            text: 'Zing voor mij, mijn engel! Laat je stem het gewelf van Parijs verbrijzelen!',
            stage_directions: 'Verheft zijn armen met theatraal vuur.',
          },
        ],
      },
    ],
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'sample-callback-en',
    userId: 'demo-actor-default',
    title: 'The West End Callback - Act 1, Scene 2 (English)',
    characters: ['Casting Director (Maya)', 'Actor (Julian)'],
    characterVoices: {
      'Casting Director (Maya)': {
        language: 'en-GB',
        pitch: 1.05,
        rate: 1.05,
        volume: 1.0,
      },
      'Actor (Julian)': {
        language: 'en-GB',
        pitch: 0.95,
        rate: 1.0,
        volume: 1.0,
      },
    },
    scenes: [
      {
        scene_title: 'Scene 1: The Cold Reading Room',
        dialogue: [
          {
            line_id: 1,
            character: 'Casting Director (Maya)',
            text: 'Thank you for waiting, Julian. Page twelve, from when the police officer enters the kitchen. Whenever you are ready.',
            stage_directions: 'Taps her pen impatiently against a stack of audition headshots.',
          },
          {
            line_id: 2,
            character: 'Actor (Julian)',
            text: 'Right. You shouldn’t be here, Detective. My mother has had enough shock for one morning.',
            stage_directions: 'Takes a deep breath, planting both feet firmly on the rehearsal tape mark.',
          },
          {
            line_id: 3,
            character: 'Casting Director (Maya)',
            text: 'Hold on. Give me more tension in the shoulders. He just hid the envelope behind the radiator. Try that line again, but quieter.',
            stage_directions: 'Adjusts her glasses, leaning forward intently.',
          },
          {
            line_id: 4,
            character: 'Actor (Julian)',
            text: 'You shouldn’t be here, Detective. She hasn’t slept in thirty hours... please, just leave us alone.',
            stage_directions: 'Lowers his voice to a strained whisper, eyes darting to the corner of the room.',
          },
          {
            line_id: 5,
            character: 'Casting Director (Maya)',
            text: 'Much better! Now pick up the cue on page thirteen. "I know about the key in the garden shed."',
            stage_directions: 'Flips the script page with a satisfied nod.',
          },
          {
            line_id: 6,
            character: 'Actor (Julian)',
            text: 'If you touch that padlock, you’re breaking the law. That garden belongs to the estate, not the city.',
            stage_directions: 'Defiantly takes one step forward.',
          },
          {
            line_id: 7,
            character: 'Casting Director (Maya)',
            text: 'Brilliant. Save that exact anger for the director callbacks on Thursday. Have a good afternoon.',
            stage_directions: 'Circles his name in red ink and smiles warmly.',
          },
        ],
      },
    ],
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
];
