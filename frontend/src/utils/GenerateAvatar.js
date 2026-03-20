const generateAvatarUrl = (style, seed) =>
  `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc,c0aede&radius=50`;

export const generateAvatar = () => {
  const data = [];
  // 6 Premium, beautiful, minimalistic vector avatars
  const seeds = ["Felix", "Aneka", "Mimi", "Ryker", "Jude", "Salem"];
  
  seeds.forEach(seed => {
    data.push(generateAvatarUrl("micah", seed));
  });

  return data;
};
