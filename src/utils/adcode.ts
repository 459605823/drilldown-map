import AreaLevel from '@/assets/json/level.json';

export const findAdcodeByName = (name: string) => {
  if (!name) return [];
  let province: {label: string; value: string} = {} as any;
  let city: {label: string; value: string} = {} as any;
  AreaLevel.forEach((item) => {
    if (item.label === name || item.label.includes(name)) {
      province = item;
      return;
    }
    if (item.children) {
      item.children.forEach((child) => {
        if (child.label === name || child.label.includes(name)) {
          province = item;
          city = child;
        }
      });
    }
  });
  return [province, city].filter((item) => item.value);
};

export const findALLAdcodeByName = (name: string) => {
  if (!name) return [];
  const result: string[] = [];
  AreaLevel.forEach((area) => {
    if (area.label.includes(name)) {
      result.push(area.label);
    }
    area.children?.forEach((child) => {
      if (child.label.includes(name)) {
        result.push(child.label);
      }
    });
  });
  return result;
};
