export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/profile/index',
  ],
  subPackages: [
    {
      root: 'sub-hanzi',
      pages: [
        'hanzi-home/index',
        'hanzi-practice/index',
        'hanzi-write/index',
        'hanzi-trace/index',
        'hanzi-test/index',
        'hanzi-result/index',
        'hanzi-history/index',
      ],
    },
    {
      root: 'sub-math',
      pages: [
        'math-home/index',
        'math-practice/index',
        'math-test/index',
        'math-result/index',
      ],
    },
    {
      root: 'sub-english',
      pages: [
        'eng-home/index',
        'eng-word/index',
        'eng-spell/index',
        'eng-listen/index',
        'eng-test/index',
        'eng-result/index',
      ],
    },
    {
      root: 'sub-game',
      pages: [
        'battle/index',
        'leaderboard/index',
        'challenge/index',
        'team/index',
        'achievements/index',
        'ai-chat/index',
        'report/index',
        'vip/index',
        'diamond/index',
        'error-book/index',
        'bind-child/index',
      ],
    },
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#4A90D9',
    navigationBarTitleText: '乐学小岛',
    navigationBarTextStyle: 'white',
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#4A90D9',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '学习',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-selected.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.png',
        selectedIconPath: 'assets/tabbar/mine-selected.png',
      },
    ],
  },
})
