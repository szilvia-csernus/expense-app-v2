export const calculateGreatestSK = (
  costPurposes: {
    SK: `COSTPURPOSE#${string}`;
    costPurposeName: string;
    costCode?: number;
  }[]
): number => {
  const skNumbers = costPurposes.map((item) => {
    const match = item.SK.match(/COSTPURPOSE#(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  });
  return Math.max(...skNumbers, 0);
};
