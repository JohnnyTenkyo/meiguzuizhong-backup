/**
 * CEO 映射表 - 将股票代码映射到对应的 CEO Twitter 账户
 * 用于自动关注股票 CEO 的 X 账户
 */

export interface CEOInfo {
  name: string;
  nameZh: string;
  twitterHandle: string;
}

export const CEO_MAPPING: Record<string, CEOInfo> = {
  // 科技公司
  'AAPL': { name: 'Tim Cook', nameZh: '蒂姆·库克', twitterHandle: 'tim_cook' },
  'MSFT': { name: 'Satya Nadella', nameZh: '萨提亚·纳德拉', twitterHandle: 'sataborat' },
  'NVDA': { name: 'Jensen Huang', nameZh: '黄仁勋', twitterHandle: 'nvidia' },
  'GOOGL': { name: 'Sundar Pichai', nameZh: '桑达尔·皮查伊', twitterHandle: 'sundarpichai' },
  'META': { name: 'Mark Zuckerberg', nameZh: '马克·扎克伯格', twitterHandle: 'facebook' },
  'TSLA': { name: 'Elon Musk', nameZh: '埃隆·马斯克', twitterHandle: 'elonmusk' },
  'AMZN': { name: 'Andy Jassy', nameZh: '安迪·贾西', twitterHandle: 'amazon' },
  'NFLX': { name: 'Ted Sarandos', nameZh: '特德·萨兰多斯', twitterHandle: 'netflix' },
  'INTC': { name: 'Pat Gelsinger', nameZh: '帕特·盖尔辛格', twitterHandle: 'intel' },
  'AMD': { name: 'Lisa Su', nameZh: '苏姿丰', twitterHandle: 'amd' },
  'QCOM': { name: 'Cristiano Amon', nameZh: '克里斯蒂亚诺·阿蒙', twitterHandle: 'qualcomm' },
  'AVGO': { name: 'Hock Tan', nameZh: '陈福阳', twitterHandle: 'broadcom' },
  'MU': { name: 'Sanjay Mehrotra', nameZh: '桑杰·梅赫罗特拉', twitterHandle: 'micron' },
  'MRVL': { name: 'Haroon Haider', nameZh: '哈鲁恩·海德', twitterHandle: 'marvell' },
  'LRCX': { name: 'Navid Zarringhalam', nameZh: '纳维德·扎林加拉姆', twitterHandle: 'lrcx' },
  'ASML': { name: 'Christophe Fouquet', nameZh: '克里斯托夫·福凯', twitterHandle: 'asml' },
  'ADBE': { name: 'Shantanu Narayen', nameZh: '尚塔努·纳拉延', twitterHandle: 'adobe' },
  'CRM': { name: 'Marc Benioff', nameZh: '马克·贝尼奥夫', twitterHandle: 'benioff' },
  'ORCL': { name: 'Safra Catz', nameZh: '萨夫拉·卡茨', twitterHandle: 'oracle' },
  'IBM': { name: 'Arvind Krishna', nameZh: '阿尔温德·克里希纳', twitterHandle: 'ibm' },
  'CSCO': { name: 'Chuck Robbins', nameZh: '查克·罗宾斯', twitterHandle: 'cisco' },
  'INTU': { name: 'Sasan Goodarzi', nameZh: '萨桑·古达尔兹', twitterHandle: 'intuit' },
  'SHOP': { name: 'Tobias Lütke', nameZh: '托比亚斯·卢特克', twitterHandle: 'tobi' },
  'UBER': { name: 'Dara Khosrowshahi', nameZh: '达拉·科斯罗沙希', twitterHandle: 'dkhos' },
  'LYFT': { name: 'David Risher', nameZh: '大卫·里舍', twitterHandle: 'lyft' },
  'SNAP': { name: 'Evan Spiegel', nameZh: '埃文·斯皮格尔', twitterHandle: 'evanspiegel' },
  'PINS': { name: 'Bill Ready', nameZh: '比尔·雷迪', twitterHandle: 'pinterest' },
  'RBLX': { name: 'David Baszucki', nameZh: '大卫·巴兹克', twitterHandle: 'roblox' },
  'U': { name: 'Jill Soltau', nameZh: '吉尔·索尔托', twitterHandle: 'universalmusic' },
  'SPOT': { name: 'Daniel Ek', nameZh: '丹尼尔·埃克', twitterHandle: 'eldsjal' },
  'ZM': { name: 'Eric Yuan', nameZh: '袁征', twitterHandle: 'ericsyuan' },
  'DOCU': { name: 'Dan Springer', nameZh: '丹·施普林格', twitterHandle: 'docusign' },
  'OKTA': { name: 'Todd McKinnon', nameZh: '托德·麦金农', twitterHandle: 'toddmckinnon' },
  'CRWD': { name: 'George Kurtz', nameZh: '乔治·库尔茨', twitterHandle: 'crowdstrike' },
  'PALO': { name: 'Nikesh Arora', nameZh: '尼克什·阿罗拉', twitterHandle: 'paloaltonetworks' },
  'NET': { name: 'Matthew Prince', nameZh: '马修·普林斯', twitterHandle: 'eastdakota' },
  'FASTLY': { name: 'Todd Nightingale', nameZh: '托德·夜莺', twitterHandle: 'fastly' },
  'DDOG': { name: 'Olivier Pomel', nameZh: '奥利维尔·波梅尔', twitterHandle: 'olivierpomel' },
  'SNOW': { name: 'Frank Slootman', nameZh: '弗兰克·斯洛特曼', twitterHandle: 'fslootman' },
  'DBX': { name: 'Drew Houston', nameZh: '德鲁·休斯顿', twitterHandle: 'drewhouston' },
  'BOX': { name: 'Aaron Levie', nameZh: '亚伦·莱维', twitterHandle: 'aaronlevie' },
  'TWLO': { name: 'Jeff Lawson', nameZh: '杰夫·劳森', twitterHandle: 'jeffiel' },
  'PLTR': { name: 'Alexander Karp', nameZh: '亚历山大·卡普', twitterHandle: 'APKarp' },
  'ABNB': { name: 'Brian Chesky', nameZh: '布莱恩·切斯基', twitterHandle: 'bchesky' },
  'DASH': { name: 'Tony Xu', nameZh: '徐晨曦', twitterHandle: 'tonyxu' },

  // 金融服务
  'JPM': { name: 'Jamie Dimon', nameZh: '杰米·戴蒙', twitterHandle: 'jpmorgan' },
  'BAC': { name: 'Brian Moynihan', nameZh: '布莱恩·莫伊尼汉', twitterHandle: 'bankofamerica' },
  'WFC': { name: 'Charlie Scharf', nameZh: '查理·沙尔夫', twitterHandle: 'wfc' },
  'GS': { name: 'David Solomon', nameZh: '大卫·所罗门', twitterHandle: 'goldmansachs' },
  'MS': { name: 'James Gorman', nameZh: '詹姆斯·戈尔曼', twitterHandle: 'morganstanley' },
  'BLK': { name: 'Larry Fink', nameZh: '劳伦斯·芬克', twitterHandle: 'blackrock' },
  'SCHW': { name: 'Walt Bettinger', nameZh: '沃尔特·贝廷格', twitterHandle: 'schwab' },
  'IBKR': { name: 'Thomas Peterffy', nameZh: '托马斯·彼得菲', twitterHandle: 'ibkr' },
  'COIN': { name: 'Brian Armstrong', nameZh: '布莱恩·阿姆斯特朗', twitterHandle: 'brian_armstrong' },
  'HOOD': { name: 'Vladimir Tenev', nameZh: '弗拉基米尔·特涅夫', twitterHandle: 'vladtenev' },
  'SOFI': { name: 'Anthony Noto', nameZh: '安东尼·诺托', twitterHandle: 'sofi' },
  'UPST': { name: 'Dave Girouard', nameZh: '戴夫·吉鲁亚尔', twitterHandle: 'upstart' },
  'AFRM': { name: 'Max Levchin', nameZh: '马克斯·莱夫钦', twitterHandle: 'mlevchin' },

  // 消费品
  'KO': { name: 'James Quincey', nameZh: '詹姆斯·昆西', twitterHandle: 'cocacola' },
  'PEP': { name: 'Ramon Laguarta', nameZh: '拉蒙·拉瓜尔塔', twitterHandle: 'pepsico' },
  'MCD': { name: 'Chris Kempczinski', nameZh: '克里斯·肯普琴斯基', twitterHandle: 'mcdonalds' },
  'SBUX': { name: 'Howard Schultz', nameZh: '霍华德·舒尔茨', twitterHandle: 'starbucks' },
  'NKE': { name: 'John Donahoe', nameZh: '约翰·多纳霍', twitterHandle: 'nike' },
  'LULU': { name: 'Calvin McDonald', nameZh: '卡尔文·麦克唐纳', twitterHandle: 'lululemon' },
  'ULTA': { name: 'Mary Dillon', nameZh: '玛丽·迪伦', twitterHandle: 'ultabeauty' },
  'FIVE': { name: 'Gary Philbin', nameZh: '加里·菲尔宾', twitterHandle: 'fivebelow' },
  'ROST': { name: 'Lex Marney', nameZh: '莱克斯·马尼', twitterHandle: 'rossstores' },
  'TJX': { name: 'Ernie Herrman', nameZh: '欧内斯特·赫尔曼', twitterHandle: 'tjxcompanies' },
  'DKS': { name: 'Roger Hawkins', nameZh: '罗杰·霍金斯', twitterHandle: 'dickssportinggoods' },
  'DECK': { name: 'Richard Donegan', nameZh: '理查德·多尼根', twitterHandle: 'decathlon' },
  'GILD': { name: 'Daniel O\'Day', nameZh: '丹尼尔·奥戴', twitterHandle: 'gilead' },
  'BIIB': { name: 'Michel Vounatsos', nameZh: '米歇尔·沃纳托斯', twitterHandle: 'biogen' },
  'AMGN': { name: 'Robert Bradway', nameZh: '罗伯特·布拉德韦', twitterHandle: 'amgen' },
  'JNJ': { name: 'Joaquin Duato', nameZh: '华金·杜阿托', twitterHandle: 'jnj' },
  'PFE': { name: 'Albert Bourla', nameZh: '阿尔伯特·布拉', twitterHandle: 'pfizer' },
  'MRK': { name: 'Rob Davis', nameZh: '罗伯特·戴维斯', twitterHandle: 'merck' },
  'AZN': { name: 'Pascal Soriot', nameZh: '帕斯卡尔·索里奥特', twitterHandle: 'astrazeneca' },
  'ABBV': { name: 'Richard Gonzalez', nameZh: '理查德·冡萨雷斯', twitterHandle: 'abbvie' },

  // 能源
  'XOM': { name: 'Darren Woods', nameZh: '达伦·伍兹', twitterHandle: 'exxonmobil' },
  'CVX': { name: 'Mike Wirth', nameZh: '迈克·沃思', twitterHandle: 'chevron' },
  'COP': { name: 'Ryan Lance', nameZh: '瑞恩·兰斯', twitterHandle: 'conocophillips' },
  'SLB': { name: 'Olivier Le Peuch', nameZh: '奥利维尔·勒佩奇', twitterHandle: 'slb' },
  'MPC': { name: 'Gretchen Watkins', nameZh: '格蕾琴·沃特金斯', twitterHandle: 'marathonpetroleum' },
  'PSX': { name: 'Mark Lashier', nameZh: '马克·拉希尔', twitterHandle: 'phillips66' },

  // 运输和物流
  'UPS': { name: 'Carol Tomé', nameZh: '卡罗尔·托梅', twitterHandle: 'ups' },
  'FDX': { name: 'Raj Subramaniam', nameZh: '拉杰·苏布拉马尼亚姆', twitterHandle: 'fedex' },
  'DAL': { name: 'Ed Bastian', nameZh: '埃德·巴斯蒂安', twitterHandle: 'delta' },
  'UAL': { name: 'Scott Kirby', nameZh: '斯科特·柯比', twitterHandle: 'united' },
  'AAL': { name: 'Robert Isom', nameZh: '罗伯特·艾索姆', twitterHandle: 'americanair' },
  'ALK': { name: 'Ben Minicucci', nameZh: '本·米尼库奇', twitterHandle: 'alaskaair' },

  // 汽车
  'F': { name: 'Jim Farley', nameZh: '吉姆·法利', twitterHandle: 'ford' },
  'GM': { name: 'Mary Barra', nameZh: '玛丽·巴拉', twitterHandle: 'gm' },
  'TM': { name: 'Koji Sato', nameZh: '佐藤康二', twitterHandle: 'toyota' },
  'HMC': { name: 'Toshihiro Mibe', nameZh: '三部敏宏', twitterHandle: 'honda' },
  'VWAGY': { name: 'Oliver Blume', nameZh: '奥利弗·布卢梅', twitterHandle: 'volkswagen' },

  // 房地产
  'PLD': { name: 'Hamid Moghadam', nameZh: '哈米德·莫加达姆', twitterHandle: 'prologis' },
  'DLR': { name: 'William Stein', nameZh: '威廉·斯坦因', twitterHandle: 'digitalrealty' },
  'EQIX': { name: 'Karl Strohmeyer', nameZh: '卡尔·斯特罗迈耶', twitterHandle: 'equinix' },
  'SPG': { name: 'Sandeep Mathrani', nameZh: '桑迪普·马特拉尼', twitterHandle: 'simon' },
  'AVB': { name: 'Bryce Blair', nameZh: '布莱斯·布莱尔', twitterHandle: 'avbcorp' },

  // 其他
  'VRT': { name: 'Vroom CEO', nameZh: 'Vroom CEO', twitterHandle: 'vroom' },
  'RIVN': { name: 'RJ Scaringe', nameZh: 'RJ·斯卡林格', twitterHandle: 'rivianmotors' },
  'LCID': { name: 'Peter Rawlinson', nameZh: '彼得·罗林森', twitterHandle: 'lucidmotors' },
  'NIO': { name: 'William Li', nameZh: '李斌', twitterHandle: 'nio' },
  'XPEV': { name: 'He Xiaopeng', nameZh: '何小鹏', twitterHandle: 'xpeng' },
  'LI': { name: 'Li Xiang', nameZh: '李想', twitterHandle: 'lixiang_li' },
};

/**
 * 根据股票代码获取 CEO 信息
 */
export function getCEOInfo(symbol: string): CEOInfo | null {
  return CEO_MAPPING[symbol.toUpperCase()] || null;
}

/**
 * 检查股票是否有对应的 CEO 信息
 */
export function hasCEOInfo(symbol: string): boolean {
  return symbol.toUpperCase() in CEO_MAPPING;
}
