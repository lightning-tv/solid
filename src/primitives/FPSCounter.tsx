import { View, Text, type Stage, type NodeProps, RendererMain, createSignal } from '@lightningtv/solid';

const fpsStyle = {
  color: 0x000000ff,
  height: 180,
  width: 330,
  x: 1900,
  y: 6,
  mountX: 1,
  alpha: 0.8,
  zIndex: 100
};

const fpsLabel = {
  x: 10,
  fontSize: 20,
  textColor: 0xf6f6f6ff
};

const fpsValue = {
  fontSize: 22,
  textColor: 0xf6f6f6ff
};

const [fps, setFps] = createSignal(0);
const [avgFps, setAvgFps] = createSignal(0);
const [minFps, setMinFps] = createSignal(99);
const [maxFps, setMaxFps] = createSignal(0);
const [criticalThresholdSignal, setCriticalThresholdSignal] = createSignal('');
const [targetThresholdSignal, setTargetThresholdSignal] = createSignal('');
const [renderableMemUsedSignal, setRenderableMemUsedSignal] = createSignal('');
const [memUsedSignal, setMemUsedSignal] = createSignal('');
const [renderableTexturesLoadedSignal, setRenderableTexturesLoadedSignal] = createSignal(0);
const [loadedTexturesSignal, setLoadedTexturesSignal] = createSignal(0);

let count = 0;
let totalFps = 0;
const infoFontSize = 14;

export const resetCounter = () => {
  // clear fps
  totalFps = 0;
  count = 0;
  setMinFps(99);
};

function bytesToMb(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(2) + ' Mb';
}

const calcFps = (fps: number) => {
  if (!fps) return;

  setFps(fps);
  setMinFps(prev => Math.min(fps, prev));
  setMaxFps(prev => Math.max(fps, prev));

  totalFps += fps;
  count++;

  setAvgFps(Math.round(totalFps / count));
};

function updateMemoryInfo(stage: Stage) {
  const memInfo = stage.txMemManager.getMemoryInfo();
  setCriticalThresholdSignal(bytesToMb(memInfo.criticalThreshold));
  setTargetThresholdSignal(bytesToMb(memInfo.targetThreshold));
  setRenderableMemUsedSignal(bytesToMb(memInfo.renderableMemUsed));
  setMemUsedSignal(bytesToMb(memInfo.memUsed));
  setRenderableTexturesLoadedSignal(memInfo.renderableTexturesLoaded);
  setLoadedTexturesSignal(memInfo.loadedTextures);
}

let frameCount = 0;
export function setupFPS(root: any) {
  root.renderer.on('fpsUpdate', (target: RendererMain, fpsData: any) => {
    const fps = typeof fpsData === 'number' ? fpsData : fpsData.fps;
    // ignore really low fps which occur on page loads
    if (fps > 5) {
      calcFps(fps);
      if (frameCount % 10 === 0) {
        updateMemoryInfo(target.stage);
        frameCount = 0;
      }
      frameCount++;
    }
  });
}

export const FPSCounter = (props: NodeProps) => {
  return (
    <View {...props} style={fpsStyle}>
      <View y={6}>
        <Text style={fpsLabel}>FPS:</Text>
        <Text style={fpsValue} x={90}>
          {fps().toString()}
        </Text>
      </View>

      <View y={6} x={160}>
        <Text style={fpsLabel}>AVG:</Text>
        <Text style={fpsValue} x={100}>
          {avgFps().toString()}
        </Text>
      </View>

      <View x={0} y={26}>
        <Text style={fpsLabel}>MIN:</Text>
        <Text style={fpsValue} x={90}>
          {minFps().toString()}
        </Text>
      </View>

      <View x={160} y={26}>
        <Text style={fpsLabel}>MAX:</Text>
        <Text style={fpsValue} x={100}>
          {maxFps().toString()}
        </Text>
      </View>

      <View display="flex" flexDirection="column" y={58} gap={4}>
        <View height={infoFontSize}>
          <Text fontSize={infoFontSize} style={fpsLabel}>
            criticalThreshold:
          </Text>
          <Text fontSize={infoFontSize} style={fpsLabel} x={230}>
            {criticalThresholdSignal()}
          </Text>
        </View>

        <View height={infoFontSize}>
          <Text fontSize={infoFontSize} style={fpsLabel}>
            targetThreshold:
          </Text>
          <Text fontSize={infoFontSize} style={fpsLabel} x={230}>
            {targetThresholdSignal()}
          </Text>
        </View>

        <View height={infoFontSize}>
          <Text fontSize={infoFontSize} style={fpsLabel}>
            renderableMemUsed:
          </Text>
          <Text fontSize={infoFontSize} style={fpsLabel} x={230}>
            {renderableMemUsedSignal()}
          </Text>
        </View>

        <View height={infoFontSize}>
          <Text fontSize={infoFontSize} style={fpsLabel}>
            memUsed:
          </Text>
          <Text fontSize={infoFontSize} style={fpsLabel} x={230}>
            {memUsedSignal()}
          </Text>
        </View>

        <View height={infoFontSize}>
          <Text fontSize={infoFontSize} style={fpsLabel}>
            renderableTexturesLoaded:
          </Text>
          <Text fontSize={infoFontSize} style={fpsLabel} x={230}>
            {renderableTexturesLoadedSignal().toString()}
          </Text>
        </View>

        <View height={infoFontSize}>
          <Text fontSize={infoFontSize} style={fpsLabel}>
            loadedTextures:
          </Text>
          <Text fontSize={infoFontSize} style={fpsLabel} x={230}>
            {loadedTexturesSignal().toString()}
          </Text>
        </View>
      </View>
    </View>
  );
};
