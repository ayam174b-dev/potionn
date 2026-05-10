import "./index.css";
import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { StockVideo } from "./StockVideo";
import {
  defaultStockVideoProps,
  type StockVideoProps,
} from "./StockVideo/schema";

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

const calculateMetadata: CalculateMetadataFunction<StockVideoProps> = ({
  props,
}) => {
  const seconds = Math.max(1, Math.min(120, props.durationInSeconds));
  return {
    durationInFrames: Math.round(seconds * FPS),
    props,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="StockVideo"
      component={StockVideo}
      durationInFrames={defaultStockVideoProps.durationInSeconds * FPS}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={defaultStockVideoProps}
      calculateMetadata={calculateMetadata}
    />
  );
};
