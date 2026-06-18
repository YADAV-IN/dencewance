const fs = require('fs');
const code = fs.readFileSync('src/components/ProfileDashboard.jsx', 'utf8');

const statsIdx = code.indexOf('{/* STATS ROW (3 BLOCKS) */}');
const chartIdx = code.indexOf('{/* PERFORMANCE CHART CARD */}');
const ctaIdx = code.indexOf('{/* THREE ACTION CTA BUTTONS */}');
const featuredIdx = code.indexOf('{/* FEATURED POST BOX */}');
const profileContentIdx = code.indexOf('{/* PROFILE CONTENT SECTION */}');

// The end is just before the "Hidden file inputs" comment
const endIdx = code.indexOf('{/* Hidden file inputs for uploads */}');

if (statsIdx > -1 && chartIdx > -1 && ctaIdx > -1 && featuredIdx > -1 && profileContentIdx > -1 && endIdx > -1) {
  // Extract blocks
  const p1 = code.substring(0, chartIdx); 
  const chartBlock = code.substring(chartIdx, ctaIdx);
  const ctaBlock = code.substring(ctaIdx, featuredIdx);
  
  // The profile content ends before "</div> \r\n </div> \r\n )}" and hidden file inputs
  // Let's just find where the actual container div ends.
  // We can just grab up to endIdx, and find the `)}` before it.
  
  const endContainerIdx = code.lastIndexOf(')}', endIdx) + 2;
  const beforeEndContainerIdx = code.lastIndexOf('</div>', endContainerIdx - 10) + 6;
  
  const featuredBlock = code.substring(featuredIdx, profileContentIdx);
  const profileContentBlock = code.substring(profileContentIdx, beforeEndContainerIdx);
  
  // Create a real SVG for Performance Chart block!
  const realChartBlock = chartBlock.replace(
    /d="M0 30 L0 25.*?Z"/s,
    `d="M0 30 L0 25 Q 12 18, 24 23 T 48 15 T 72 20 T 100 8 L100 30 Z"`
  ).replace(
    /d="M0 25 Q 12 18.*?100 8"/s,
    `d="M0 25 Q 12 18, 24 23 T 48 15 T 72 20 T 100 8"`
  ); // I'll refine this SVG later, just need structural reorder for now.
  
  // Reorder: 1. Profile Content 2. Chart 3. CTA 4. Featured Post
  // Wait, the user wants Profile Content FIRST.
  
  const newMiddle = '\n' + profileContentBlock + '\n\n' + realChartBlock + '\n' + ctaBlock + '\n' + featuredBlock + '\n        </div>\n      )}';
  
  const newCode = p1 + newMiddle + code.substring(endContainerIdx);
  fs.writeFileSync('src/components/ProfileDashboard.jsx', newCode);
  console.log('Reordered successfully');
} else {
  console.log('Could not find all sections. Indices:', {
    statsIdx, chartIdx, ctaIdx, featuredIdx, profileContentIdx, endIdx
  });
}
