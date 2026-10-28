import type { Params } from '@/core/params';
import type { Preset } from '@/data/presets';
import { Button, ButtonGrid, ButtonRow, Section, Select, Slider, Stats } from '@/ui';
import { t } from '@/shared/i18n';
import { PALETTES, type Palette } from '@/shared/palette';
import type { BoardChoice, Display, FieldStats } from '../types';

type Props = {
  presets: Preset[];
  presetId: string;
  running: boolean;
  /** Steps per frame */
  speed: number;
  boards: BoardChoice[];
  boardId: string;
  params: Params;
  display: Display;
  stats: FieldStats;
  onPresetChange: (id: string) => void;
  onToggleRunning: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  onBoardChange: (id: string) => void;
  onParamsChange: (params: Params) => void;
  onRestart: () => void;
  onClear: () => void;
  onDisplayChange: (display: Display) => void;
};

/** Shows feed and kill with enough digits to tell presets apart */
const formatRate = (value: number) => value.toFixed(4);

/**
 * The control panel on the right. From the top: "Playback", "Patterns", "Numbers", "Grid", "Display".
 *
 * @param props.presets         Patterns to choose from
 * @param props.presetId        Selected pattern
 * @param props.running         Whether it is playing
 * @param props.speed           Steps per frame
 * @param props.boards          Grid sizes to choose from
 * @param props.boardId         Current grid size
 * @param props.params          Diffusion rates, feed and kill
 * @param props.display         How the field looks
 * @param props.stats           Step count and frame rate
 * @param props.onPresetChange  Changes the pattern
 * @param props.onToggleRunning Plays or stops
 * @param props.onStep          Moves one frame
 * @param props.onSpeedChange   Changes the steps per frame
 * @param props.onBoardChange   Changes the grid size
 * @param props.onParamsChange  Changes a number
 * @param props.onRestart       Starts again with new seeds
 * @param props.onClear         Empties the dish, so you can paint your own seeds
 * @param props.onDisplayChange Changes how the field looks
 */
export function ControlPanel(props: Props) {
  const setParam = (key: keyof Params) => (value: number) =>
    props.onParamsChange({ ...props.params, [key]: value });

  return (
    <>
      <Section title={t({ ja: '再生', en: 'Playback' })}>
        <ButtonRow>
          <Button onClick={props.onToggleRunning} active={props.running} title="Space">
            {props.running ? t({ ja: '■ 停止', en: '■ Stop' }) : t({ ja: '▶ 再生', en: '▶ Play' })}
          </Button>
          <Button onClick={props.onStep} title="→">
            {t({ ja: '1コマ', en: 'Step' })}
          </Button>
        </ButtonRow>
        <Slider
          label={t({ ja: '速さ', en: 'Speed' })}
          value={props.speed}
          min={1}
          max={32}
          format={(value) => t({ ja: `${value} 回/コマ`, en: `${value}/frame` })}
          onChange={props.onSpeedChange}
        />
        <Stats {...props.stats} />
      </Section>

      <Section title={t({ ja: '模様', en: 'Patterns' })}>
        <ButtonGrid>
          {props.presets.map((preset, i) => (
            <Button
              key={preset.id}
              onClick={() => props.onPresetChange(preset.id)}
              active={preset.id === props.presetId}
              title={String(i + 1)}
            >
              {t(preset.name)}
            </Button>
          ))}
        </ButtonGrid>
      </Section>

      <Section title={t({ ja: '数値', en: 'Numbers' })}>
        <Slider
          label={t({ ja: '補充 F', en: 'Feed F' })}
          value={props.params.feed}
          min={0.01}
          max={0.1}
          step={0.0005}
          format={formatRate}
          onChange={setParam('feed')}
        />
        <Slider
          label={t({ ja: '除去 k', en: 'Kill k' })}
          value={props.params.kill}
          min={0.04}
          max={0.075}
          step={0.0005}
          format={formatRate}
          onChange={setParam('kill')}
        />
        <Slider
          label={t({ ja: '拡散 u', en: 'Spread u' })}
          value={props.params.du}
          min={0}
          max={0.16}
          step={0.01}
          format={(value) => value.toFixed(2)}
          onChange={setParam('du')}
        />
        <Slider
          label={t({ ja: '拡散 v', en: 'Spread v' })}
          value={props.params.dv}
          min={0}
          max={0.16}
          step={0.01}
          format={(value) => value.toFixed(2)}
          onChange={setParam('dv')}
        />
      </Section>

      <Section title={t({ ja: '盤面', en: 'Grid' })}>
        <Select
          label={t({ ja: '大きさ', en: 'Size' })}
          value={props.boardId}
          onChange={props.onBoardChange}
        >
          {props.boards.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {t(choice.name)} ({choice.width} × {choice.height})
            </option>
          ))}
        </Select>
        <ButtonRow>
          <Button onClick={props.onRestart} title="R">
            {t({ ja: 'まき直す', en: 'Seed again' })}
          </Button>
          <Button onClick={props.onClear} title="C">
            {t({ ja: '空にする', en: 'Clear' })}
          </Button>
        </ButtonRow>
      </Section>

      <Section title={t({ ja: '表示（模様には影響しない）', en: 'Display (visual only)' })}>
        <Select
          label={t({ ja: '色', en: 'Colors' })}
          value={props.display.palette}
          onChange={(palette) =>
            props.onDisplayChange({ ...props.display, palette: palette as Palette })
          }
        >
          {PALETTES.map((palette) => (
            <option key={palette.id} value={palette.id}>
              {t(palette.name)}
            </option>
          ))}
        </Select>
      </Section>
    </>
  );
}
