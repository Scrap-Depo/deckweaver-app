import { LayoutGrid, Waypoints, Target, Activity, Users, Triangle } from 'lucide-react';
import type { Technique } from '@/types/mac';

export const TECHNIQUES: Technique[] = [
  {
    id: 'simple',
    name: 'Открытый стол',
    icon: LayoutGrid,
    desc: 'Выберите в открытую или вслепую карты для исследования запроса, затем переместите на стол',
    type: 'dynamic',
    bgRender: null,
    prompts: [
      "Что вы видите на этой карте?",
      "Какие детали привлекли внимание?",
      "Какие эмоции или телесные ощущения вызывает это изображение?",
      "Что эта карта говорит о вашем запросе или текущей ситуации?"
    ]
  },
  {
    id: 'path',
    name: 'Путь (GROW)',
    icon: Waypoints,
    desc: 'Дорога к цели. Слоты открываются последовательно',
    type: 'fixed',
    sequential: true,
    cardScale: 1.25,
    bgRender: 'road',
    slots: [
      { id: 's1', label: '1.\u00A0Чего бы мне хотелось', x: 85, y: 25, blind: false, labelPos: 'top' },
      { id: 's2', label: '2.\u00A0Мое состояние сейчас', x: 15, y: 85, blind: false, labelPos: 'right' },
      { id: 's3', label: '3.\u00A0Что мне поможет', x: 55, y: 65, blind: false, labelPos: 'left' },
      { id: 's4', label: '4.\u00A0Что станет препятствием', x: 25, y: 45, blind: false, labelPos: 'right' },
      { id: 's5', label: '5.\u00A0Неожиданный ресурс', x: 75, y: 45, blind: true, labelPos: 'right' },
      { id: 's6', label: '6.\u00A0На что обратить внимание', x: 45, y: 25, blind: false, labelPos: 'bottom' }
    ],
    prompts: [
      "Что вы видите на этой карте?",
      "Какие детали привлекли внимание?",
      "Какие эмоции или телесные ощущения вызывает это изображение?",
      "Что эта карта говорит о вашем запросе?"
    ]
  },
  {
    id: 'pyramid',
    name: 'Пирамида логических уровней',
    icon: Triangle,
    desc: 'Исследование цели по уровням Роберта Дилтса: от окружения до миссии',
    type: 'fixed',
    sequential: true,
    cardScale: 0.95,
    bgRender: 'pyramid',
    slots: [
      {
        id: 'p0', label: 'Запрос', x: 50, y: 25, blind: false, labelPos: 'top',
        tablePrompts: ["Что ты хочешь изменить в своей жизни?"]
      },
      {
        id: 'p1', label: '1.\u00A0Окружение', x: 12, y: 75, blind: false, labelPos: 'top',
        tablePrompts: ["Что происходит в твоем окружении?"]
      },
      {
        id: 'p2', label: '2.\u00A0Действия', x: 27.2, y: 75, blind: false, labelPos: 'top',
        tablePrompts: ["Что ты уже делаешь, чтобы достигнуть цель?", "Что еще не делаешь, но можешь делать?"]
      },
      {
        id: 'p3', label: '3.\u00A0Способности', x: 42.4, y: 75, blind: false, labelPos: 'top',
        tablePrompts: ["Какие ваши способности или возможности помогут достичь цели?"]
      },
      {
        id: 'p4', label: '4.\u00A0Убеждения', x: 57.6, y: 75, blind: false, labelPos: 'top',
        tablePrompts: ["Какие убеждения тебя поддерживают на пути к цель?", "Почему важно достичь этой Цели?"]
      },
      {
        id: 'p5', label: '5.\u00A0Идентичность', x: 72.8, y: 75, blind: false, labelPos: 'top',
        tablePrompts: ["Кем ты себя видишь, когда достигнешь цели?"]
      },
      {
        id: 'p6', label: '6.\u00A0Миссия', x: 88, y: 75, blind: false, labelPos: 'top',
        tablePrompts: ["Ради чего большего нужна эта цель?"]
      }
    ],
    prompts: [
      "Опишите факты, которые вы видите на карте.",
      "Как этот образ метафорически отвечает на вопрос этого уровня?",
      "Какие скрытые смыслы вы здесь замечаете?"
    ]
  },
  {
    id: 'ikigai',
    name: 'Призвание (Икигай)',
    icon: Target,
    desc: 'Поиск смыслов, ради чего стоит просыпаться по утрам',
    type: 'fixed',
    sequential: false,
    cardScale: 1.35,
    bgRender: 'ikigai',
    slots: [
      { id: 'i1', label: '', x: 50, y: 15, blind: false, isIkigai: true },
      { id: 'i2', label: '', x: 20, y: 50, blind: false, isIkigai: true },
      { id: 'i3', label: '', x: 80, y: 50, blind: false, isIkigai: true },
      { id: 'i4', label: '', x: 50, y: 85, blind: false, isIkigai: true },
      { id: 'i5', label: 'Призвание', x: 50, y: 50, blind: false }
    ],
    prompts: [
      "Как эта карта отражает данную сферу вашей жизни?",
      "Какие чувства вызывает этот образ в контексте призвания?",
      "Если бы эта карта была действием, что бы вы сделали прямо сейчас?"
    ]
  },
  {
    id: 'score',
    name: 'Нейрокоучинг (SCORE)',
    icon: Activity,
    desc: 'Линейный анализ проблемы: Ситуация, Причины, Результат, Ресурсы, Эффекты',
    type: 'fixed',
    sequential: false,
    cardScale: 1.25,
    bgRender: 'timeline',
    slots: [
      {
        id: 'sc1', label: 'Ситуация', x: 15, y: 25, blind: false, labelPos: 'top',
        tablePrompts: ["Что вы хотите изменить?", "Какую выгоду и пользу Вы получаете от этой ситуации?"]
      },
      {
        id: 'sc2', label: 'Причины', x: 32.5, y: 25, blind: false, labelPos: 'top',
        tablePrompts: ["Что послужило первопричиной ситуации?"]
      },
      {
        id: 'sc3', label: 'Результат', x: 50, y: 25, blind: false, labelPos: 'top',
        tablePrompts: ["Что хотите получить вместо того, что есть сейчас?"]
      },
      {
        id: 'sc4', label: 'Ресурсы / барьеры', x: 67.5, y: 25, blind: false, labelPos: 'top',
        tablePrompts: [
          "Что мешает достичь цель?",
          "Что вам поможет пройти сквозь препятствия (люди, действия, убеждения)?",
          "Есть у вас к ним доступ? Что поможет получить доступ?",
          "Что уже сейчас помогает двигаться к цели?",
          "Что помогло бы перейти к быстрым изменениям?"
        ]
      },
      {
        id: 'sc5', label: 'Эффекты', x: 85, y: 25, blind: false, labelPos: 'top',
        tablePrompts: [
          "На каких значимых для вас людях отразится изменение ситуации?",
          "На какие важные аспекты вашей жизни повлияет это изменение?",
          "Что еще будет по-другому?"
        ]
      }
    ],
    prompts: [
      "Опишите факты, которые вы видите на карте.",
      "Как этот образ связан с данным этапом?",
      "Какой следующий шаг подсказывает вам эта карта?"
    ]
  },
  {
    id: 'subpersonalities',
    name: 'Субличности',
    icon: Users,
    desc: 'Интеграция конфликтных частей личности - быстрый путь к трансформации',
    type: 'fixed',
    sequential: false,
    cardScale: 1.45,
    bgRender: 'versus',
    slots: [
      { id: 'sub1', label: '1.\u00A0Субличность', x: 20, y: 30, blind: false, labelPos: 'top' },
      { id: 'sub2', label: '2.\u00A0Субличность', x: 80, y: 30, blind: false, labelPos: 'top' },
      { id: 'sub3', label: '3.\u00A0Субличность', x: 20, y: 70, blind: false, labelPos: 'top' },
      { id: 'sub4', label: '4.\u00A0Субличность', x: 80, y: 70, blind: false, labelPos: 'top' },
      { id: 'centerText', label: '', x: 50, y: 50, blind: false, isTextCenter: true }
    ],
    prompts: []
  }
];
