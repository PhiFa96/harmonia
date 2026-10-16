import { copy } from './helpers.mjs';
export async function visibleStaffSignature(page) {
  return page
    .locator('svg:visible text')
    .evaluateAll((nodes) =>
      nodes.map((node) => [node.textContent, node.getAttribute('x'), node.getAttribute('y')]),
    );
}

// Read the visible staff, like a learner. No seed/answer state or test hook in the app.
export async function answerVisibleNaturalNote(page, locale) {
  await page.getByTestId('exercise-question').waitFor();
  const name = await page.locator('svg:visible').evaluateAll((svgs) => {
    const svg = svgs.find((node) =>
      [...node.querySelectorAll('text')].some((text) =>
        ['\uE0A2', '\uE0A3', '\uE0A4'].includes(text.textContent),
      ),
    );
    if (!svg) throw new Error('Visible note missing');
    const head = [...svg.querySelectorAll('text')].find((text) =>
      ['\uE0A2', '\uE0A3', '\uE0A4'].includes(text.textContent),
    );
    const ys = [
      ...new Set(
        [...svg.querySelectorAll('line')]
          .filter(
            (line) =>
              line.getAttribute('y1') === line.getAttribute('y2') &&
              Number(line.getAttribute('x2')) - Number(line.getAttribute('x1')) > 100,
          )
          .map((line) => Number(line.getAttribute('y1'))),
      ),
    ].sort((a, b) => a - b);
    if (ys.length !== 5) throw new Error('Expected five visible staff lines');
    const steps = Math.round((ys[4] - Number(head.getAttribute('y'))) / ((ys[1] - ys[0]) / 2));
    if (steps < 0 || steps > 8) throw new Error('Expected an in-staff treble note');
    return ['E', 'F', 'G', 'A', 'B', 'C', 'D'][steps % 7];
  });
  await page.getByTestId('answer-' + name + ':0').click();
  await page.getByRole('button', { name: copy(locale).check, exact: true }).click();
  await page.getByTestId('exercise-next').click();
}
