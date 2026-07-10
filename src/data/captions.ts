export interface CaptionCategory {
  name: string
  captions: string[]
}

export const captionCategories: CaptionCategory[] = [
  {
    name: '上班',
    captions: [
      '不敢睡觉，睡醒了又要去上班了',
      '爱来爱去的，上两天班就老实了',
      '希望大家都能走出舒适圈，让我进去',
      '成年人想要翻身，一定要买长一点的数据线',
    ],
  },
  {
    name: '摆烂',
    captions: [
      '明天的事，后天就知道了',
      '努力不一定成功，不努力一定很轻松',
      '没出息没关系，有气息已经很棒了',
      '收到，办不到',
      '在想了，别催',
      '希望今天别发生需要我动脑子的事',
    ],
  },
  {
    name: '社交',
    captions: [
      '花开富贵，申请添加好友',
      '不理解，但尊重',
      '你说得对',
      '稍等，我正在编',
    ],
  },
  {
    name: '没钱',
    captions: [
      '失败是成功之母，V我五十你就是成功支付',
      '我的财富非常自由，甚至不待在我的账户里',
    ],
  },
  {
    name: '减肥',
    captions: [
      '生活没有一点甜头，那很减脂了',
    ],
  },
  {
    name: '熬夜',
    captions: [
      '熬夜伤身体，建议通宵',
    ],
  },
  {
    name: '万能回复',
    captions: [
      '我不是情绪越来越稳定，而是老了反应有点慢',
      '世上无难事，只怕有些人',
      '问题不大，问题很大',
    ],
  },
]

export function getRandomCaption(): string {
  const all = captionCategories.flatMap((c) => c.captions)
  return all[Math.floor(Math.random() * all.length)]
}
