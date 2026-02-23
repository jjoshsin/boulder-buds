export const getSettingLabel = (setting: string): string => {
  const labels: { [key: string]: string } = {
    comp_style: 'Comp Style',
    fun: 'Fun',
    creative: 'Creative',
    straightforward: 'Straightforward',
  };
  return labels[setting] || setting;
};

export const getDifficultyLabel = (difficulty: string): string => {
  const labels: { [key: string]: string } = {
    soft: 'Soft',
    normal: 'Normal',
    hard: 'Hard',
  };
  return labels[difficulty] || difficulty;
};