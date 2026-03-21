import {
  type OutfitFormState,
  type OutfitRecommendation,
  type StyleOption,
} from "@/components/outfit/types";

type OutfitTemplate = {
  tops: string[];
  bottoms: string[];
  shoes: string[];
  accentTags: string[];
};

const TEMPLATES: Record<StyleOption, OutfitTemplate> = {
  简约: {
    tops: ["米白针织上衣", "纯色短款衬衫", "浅灰落肩 T 恤", "燕麦色薄外套"],
    bottoms: ["高腰直筒裤", "垂感半身裙", "九分西装裤", "深色牛仔裤"],
    shoes: ["小白鞋", "乐福鞋", "低跟短靴", "极简凉鞋"],
    accentTags: ["干净配色", "低饱和"],
  },
  通勤: {
    tops: ["廓形西装外套", "丝质衬衫", "修身针织衫", "轻薄风衣"],
    bottoms: ["烟管裤", "中长铅笔裙", "锥形西裤", "高腰直筒裙"],
    shoes: ["乐福鞋", "中跟单鞋", "尖头短靴", "皮质穆勒鞋"],
    accentTags: ["办公室", "利落"],
  },
  约会: {
    tops: ["法式方领上衣", "柔雾感衬衫", "修身针织开衫", "垂坠感吊带叠穿"],
    bottoms: ["A 字半裙", "缎面长裙", "高腰微喇裤", "百褶短裙"],
    shoes: ["玛丽珍鞋", "细带凉鞋", "短跟踝靴", "尖头单鞋"],
    accentTags: ["氛围感", "精致"],
  },
  休闲: {
    tops: ["连帽卫衣", "条纹长袖 T 恤", "宽松牛仔外套", "基础款背心叠穿"],
    bottoms: ["束脚休闲裤", "直筒牛仔裤", "工装半裙", "运动短裤"],
    shoes: ["复古跑鞋", "帆布鞋", "厚底拖鞋", "休闲凉鞋"],
    accentTags: ["轻松", "好穿"],
  },
  街头: {
    tops: ["印花 Oversize T 恤", "机能夹克", "短款工装背心", "拼接卫衣"],
    bottoms: ["宽松工装裤", "阔腿牛仔裤", "抽绳运动裤", "多口袋短裤"],
    shoes: ["高帮板鞋", "老爹鞋", "机能短靴", "厚底帆布鞋"],
    accentTags: ["层次感", "潮流"],
  },
  韩系: {
    tops: ["短款针织开衫", "廓形衬衫", "基础高领打底", "宽松西装外套"],
    bottoms: ["高腰直筒裤", "百褶短裙", "垂感西装裤", "深色牛仔裤"],
    shoes: ["德训鞋", "乐福鞋", "玛丽珍鞋", "简约短靴"],
    accentTags: ["清爽", "韩系氛围"],
  },
  老钱风: {
    tops: ["羊毛针织衫", "挺括衬衫", "翻领针织 Polo", "浅驼色西装外套"],
    bottoms: ["高腰西装裤", "及踝半裙", "直筒长裤", "卡其长裙"],
    shoes: ["乐福鞋", "皮质单鞋", "短跟踝靴", "简洁穆勒鞋"],
    accentTags: ["质感", "克制"],
  },
  禁欲风: {
    tops: ["黑色衬衫", "修身高领上衣", "深灰针织衫", "极简西装外套"],
    bottoms: ["直筒西裤", "深色长裙", "利落锥形裤", "垂坠阔腿裤"],
    shoes: ["尖头短靴", "皮质乐福鞋", "极简单鞋", "低跟踝靴"],
    accentTags: ["冷感", "利落"],
  },
  美式复古: {
    tops: ["复古印花卫衣", "灯芯绒外套", "条纹橄榄球衫", "做旧牛仔夹克"],
    bottoms: ["水洗牛仔裤", "卡其工装裤", "复古短裙", "直筒长裤"],
    shoes: ["复古跑鞋", "高帮帆布鞋", "棕色短靴", "厚底板鞋"],
    accentTags: ["复古感", "随性"],
  },
  甜酷: {
    tops: ["短款上衣", "修身针织衫", "皮质夹克", "设计感衬衫"],
    bottoms: ["百褶短裙", "微喇长裤", "工装半裙", "高腰短裤"],
    shoes: ["厚底玛丽珍", "短靴", "老爹鞋", "绑带单鞋"],
    accentTags: ["反差感", "吸睛"],
  },
};

// 根据场景关键词推断更合适的季节标签。
function inferSeason(scene: string) {
  if (/(冬|冷|雪|羽绒|大衣)/.test(scene)) return "秋冬";
  if (/(夏|热|海边|度假|短袖)/.test(scene)) return "春夏";
  return "四季通用";
}

// 根据场景关键词补充氛围标签。
function inferMood(scene: string) {
  if (/(面试|会议|上班|通勤)/.test(scene)) return "专业";
  if (/(约会|聚会|晚餐|咖啡)/.test(scene)) return "有氛围";
  if (/(旅行|逛街|周末|散步)/.test(scene)) return "放松";
  return "场景适配";
}

function hashText(input: string) {
  return Array.from(input).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function pickItem(items: string[], start: number, offset: number) {
  return items[(start + offset) % items.length];
}

// 生成单套搭配的中文解释文案。
function createExplanation(
  form: OutfitFormState,
  recommendation: Omit<OutfitRecommendation, "explanation">
) {
  const profileSummary = [
    form.userProfile.gender && `性别偏好为${form.userProfile.gender}`,
    form.userProfile.height && `身高约${form.userProfile.height}cm`,
    form.userProfile.weight && `体重约${form.userProfile.weight}kg`,
    form.userProfile.preferences && `额外偏好是“${form.userProfile.preferences}”`,
  ]
    .filter(Boolean)
    .join("，");

  return `这套搭配以${form.style}风格为核心，针对“${form.scene}”场景做了组合。${recommendation.top}搭配${recommendation.bottom}能快速建立清晰轮廓，${recommendation.shoes}负责把整体完成度拉起来。${profileSummary ? `${profileSummary}，因此我优先保留舒适度和风格一致性。` : "整体重点放在易穿、好搭和场景匹配上。"} 标签中的${recommendation.tags.join(" / ")}说明它更适合当前场景与季节。`;
}

// 在模型不可用时，生成可展示的本地兜底推荐。
export function generateMockRecommendations(
  form: OutfitFormState,
  version: number
): OutfitRecommendation[] {
  const template = TEMPLATES[form.style];
  const seed = hashText(
    `${form.scene}-${form.style}-${form.userProfile.height}-${form.userProfile.weight}-${form.userProfile.preferences}-${version}`
  );
  const season = inferSeason(form.scene);
  const mood = inferMood(form.scene);

  return Array.from({ length: 3 }, (_, index) => {
    const recommendation = {
      id: `outfit-${version}-${index}`,
      top: pickItem(template.tops, seed % template.tops.length, index),
      bottom: pickItem(template.bottoms, seed % template.bottoms.length, index + 1),
      shoes: pickItem(template.shoes, seed % template.shoes.length, index + 2),
      tags: [
        form.style,
        season,
        mood,
        template.accentTags[index % template.accentTags.length],
      ],
      score: 86 + ((seed + index * 7) % 12),
    };

    return {
      ...recommendation,
      explanation: createExplanation(form, recommendation),
    };
  });
}
