export const NECKLACE_STYLES = `
  .ch-necklace{position:absolute;left:50%;top:34px;width:170px;height:88px;transform:translateX(-50%);z-index:9;pointer-events:none;}
  .ch-necklace-chain{position:absolute;left:50%;top:0;width:166px;height:30px;margin-left:-83px;border:3px solid var(--chain-color,#c9a227);border-top:none;border-radius:0 0 50% 50%;box-sizing:border-box;}
  .ch-necklace-link{position:absolute;left:50%;top:26px;width:4px;height:16px;margin-left:-2px;background:var(--chain-color,#c9a227);border-radius:1px;}
  .ch-necklace-pendant{position:absolute;left:50%;top:40px;width:68px;height:68px;margin-left:-34px;border:3px solid #222;border-radius:50%;background:radial-gradient(circle at 32% 28%,#ffcc66,var(--pendant-color,#f7931a) 52%,#a85a08);box-shadow:inset 0 -6px 0 rgba(0,0,0,.15),0 4px 8px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:44px;line-height:1;color:#fff;text-shadow:0 2px 5px rgba(0,0,0,.5);font-family:system-ui,-apple-system,sans-serif;}
`;
