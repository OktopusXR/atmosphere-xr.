// ATMOSPHERE / authored animation envelopes. These are provisional musical
// marks, to be refined against the final soundtrack. No microphone/FFT input.
const times=[0,11,26,39,57,73,89,105,114,129,143,158,172,184,199,213,226,243,258,273,287,300,314,330,348,361,374,389,402];
const dynamics=[.21,.29,.33,.42,.31,.39,.48,.28,.3,.46,.4,.34,.43,.48,.32,.39,.52,.33,.37,.45,.3,.43,.39,.49,.32,.35,.25,.3,.17];
function smooth(t){t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)}
function sample(t){
 let i=0;while(i<times.length-2&&times[i+1]<t)i++;
 let q=(t-times[i])/(times[i+1]-times[i]);
 return dynamics[i]+(dynamics[i+1]-dynamics[i])*smooth(q);
}
export function scoreEnvelope(t){
 const intensity=sample(Math.max(0,Math.min(402,t)));
 // Entirely continuously differentiable motion.
 return {
  bass:.08+intensity*.23,
  mid:.09+intensity*.18+.035*Math.sin(t*.12),
  high:.11+intensity*.14,
  attack:.045+.07*(.5+.5*Math.sin(t*.19)),
  rms:intensity
 };
}
