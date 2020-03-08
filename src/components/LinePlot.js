import React, { Component } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { ResponsiveBump } from '@nivo/bump'
import { ResponsiveStream } from '@nivo/stream'
import { MdArrowDropDownCircle } from 'react-icons/md'
import { UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { isMobile, isIPad13 } from 'react-device-detect'
import { generatePlotData } from '../utils/plot_data'
import { parseDate, getDataFromRegion } from '../utils/utils'
import { plotTypes } from '../utils/plot_types'
import * as str from '../utils/strings'
import i18n from '../data/i18n.yml'

export default class LinePlot extends Component {
    state = {
        height: 290,
        dropdownOpen: false,
        plotType: 'total'
    }

    componentDidMount() {
        this.updateHight()
        window.addEventListener('resize', this.updateHight)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateHight)
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            this.props.currentRegion.length === 1 &&
            this.props.currentRegion[0] === str.GLOBAL_ZH &&
            this.state.plotType === 'one_vs_rest'
        )
            this.setState({
                plotType: 'total'
            })

        if (
            Object.keys(getDataFromRegion(this.props.data, this.props.currentRegion)).length === 4 &&
            (this.props.currentRegion.length !== 1 || this.props.currentRegion[0] !== str.GLOBAL_ZH) &&
            this.state.plotType === 'most_affected_subregions'
        )
            this.setState({
                plotType: 'total'
            })
    }

    updateHight = () => {
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)

        this.setState({
            height: vh < 850 && vw >= 992 ? 240 : 290
        })
    }

    render() {
        const { data, currentRegion, playing, tempDate, endDate, startDate, scale, lang, darkMode } = this.props

        if (data == null) return <div />

        const plotParameters = plotTypes[this.state.plotType]
        const plotDataAll = generatePlotData({ ...this.props, plotType: this.state.plotType })
        const plotData = plotDataAll.plotData

        const isDataEmpty =
            this.state.plotType !== 'remaining_confirmed'
                ? plotData.map((d) => d.data.length).reduce((s, x) => s + x, 0) === 0
                : plotData.map((d) => Object.keys(d).length).reduce((s, x) => s + x, 0) === 0

        const tickValues = isDataEmpty ? 0 : plotDataAll.tickValues

        const plotTheme = {
            fontFamily: 'Saira, sans-serif',
            textColor: darkMode ? 'var(--lighter-grey)' : 'black',
            grid: {
                line: {
                    stroke: darkMode ? 'var(--darkest-grey)' : 'var(--lighter-grey)'
                }
            },
            tooltip: {
                container: {
                    background: darkMode ? 'var(--darkest-grey)' : 'white',
                    color: darkMode ? 'var(--lighter-grey)' : 'black'
                }
            }
        }

        return (
            <div className="plot-wrap">
                <UncontrolledDropdown className="">
                    <DropdownToggle
                        tag="span"
                        className="line-plot-title"
                        data-toggle="dropdown"
                        aria-expanded={this.state.dropdownOpen}
                    >
                        <span>{plotParameters.text[lang]}</span>
                        <MdArrowDropDownCircle size={20} className="dropdown-arrow" />
                    </DropdownToggle>
                    <DropdownMenu>
                        {Object.keys(plotTypes).map(
                            (plotType) =>
                                // no One-vs-Rest comparison plot when current region is Global
                                plotType === 'one_vs_rest' &&
                                currentRegion.length === 1 &&
                                currentRegion[0] === str.GLOBAL_ZH ? (
                                    <div key={`dropdown-${plotType}`} />
                                ) : plotType === 'most_affected_subregions' &&
                                (Object.keys(getDataFromRegion(this.props.data, currentRegion)).length === 4 &&
                                    (currentRegion.length !== 1 || currentRegion[0] !== str.GLOBAL_ZH)) ? (
                                    <div key={`dropdown-${plotType}`} />
                                ) : (
                                    <DropdownItem
                                        key={`dropdown-${plotType}`}
                                        className={this.state.plotType === plotType ? 'current' : ''}
                                        onClick={() =>
                                            this.setState({
                                                plotType,
                                                dropdownOpen: !this.state.dropdownOpen
                                            })}
                                    >
                                        {plotTypes[plotType].text[lang]}
                                    </DropdownItem>
                                )
                        )}
                    </DropdownMenu>
                </UncontrolledDropdown>
                <div style={{ height: this.state.height, width: '100%' }}>
                    {isDataEmpty ? (
                        <div className="plot-no-data">
                            <span>{i18n.NO_DATA[lang]}</span>
                        </div>
                    ) : (
                        <div />
                    )}
                    {plotParameters.type === 'line' && (
                        <ResponsiveLine
                            margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
                            theme={plotTheme}
                            animate={true}
                            data={plotData}
                            colors={(d) => d.color}
                            xFormat={plotParameters.xFormat != null ? plotParameters.xFormat : 'time:%Y-%m-%d'}
                            yFormat={plotParameters.yFormat}
                            xScale={
                                plotParameters.xScale != null ? (
                                    plotParameters.xScale
                                ) : (
                                    {
                                        type: 'time',
                                        format: '%Y-%m-%d',
                                        precision: 'day',
                                        useUTC: false
                                    }
                                )
                            }
                            yScale={
                                plotParameters.yScale != null ? (
                                    plotParameters.yScale
                                ) : scale === 'linear' || !plotParameters.log ? (
                                    {
                                        type: 'linear',
                                        max: 'auto',
                                        min: 'auto'
                                    }
                                ) : (
                                    {
                                        type: 'log',
                                        min: plotDataAll.logTickMin,
                                        max: plotDataAll.logTickMax
                                    }
                                )
                            }
                            axisLeft={{
                                orient: 'left',
                                // do not show ticks with non-integer values
                                format: plotParameters.yAxisFormat,
                                tickSize: 0,
                                tickValues:
                                    plotParameters.yTickValues != null ? plotParameters.yTickValues : tickValues,
                                legend: plotParameters.yLegend != null ? plotParameters.yLegend[lang] : '',
                                legendOffset: -40,
                                legendPosition: 'middle'
                            }}
                            axisBottom={{
                                orient: 'bottom',
                                format: plotParameters.xAxisFormat,
                                tickValues: plotParameters.xTickValues != null ? plotParameters.xTickValues : 5,
                                legend: plotParameters.xLegend != null ? plotParameters.xLegend[lang] : '',
                                legendOffset: 40,
                                legendPosition: 'middle'
                            }}
                            enableGridX={false}
                            gridYValues={plotParameters.yTickValues != null ? plotParameters.yTickValues : tickValues}
                            pointSize={plotParameters.pointSize != null ? plotParameters.pointSize : 6}
                            pointBorderWidth={0}
                            pointBorderColor={'white'}
                            useMesh={true}
                            enableArea={false}
                            enablePointLabel={plotParameters.enablePointLabel}
                            pointLabel={plotParameters.pointLabel}
                            pointLabelYOffset={-6}
                            enableSlices={plotParameters.enableSlices != null ? plotParameters.enableSlices : 'x'}
                            curve={'monotoneX'}
                            tooltip={plotParameters.tooltip}
                            markers={
                                plotParameters.hideMarkers ? (
                                    []
                                ) : !playing && tempDate !== startDate && tempDate !== endDate ? (
                                    [
                                        {
                                            axis: 'x',
                                            value: parseDate(tempDate),
                                            lineStyle: {
                                                stroke: darkMode ? 'var(--primary-color-4)' : 'var(--primary-color-5)',
                                                strokeWidth: 1,
                                                strokeDasharray: '6 6'
                                            }
                                        }
                                    ]
                                ) : (
                                    []
                                )
                            }
                            legends={
                                plotParameters.hideLegends ? (
                                    []
                                ) : (
                                    [
                                        {
                                            anchor: 'bottom',
                                            direction: 'row',
                                            justify: false,
                                            translateX: 0,
                                            translateY: 50,
                                            itemsSpacing: 10,
                                            itemDirection: 'left-to-right',
                                            itemWidth: plotParameters.legendItemWidth,
                                            itemHeight: 20,
                                            itemOpacity: 0.75,
                                            symbolSize: 12,
                                            symbolShape: 'circle',
                                            symbolBorderColor: 'rgba(0, 0, 0, .5)',
                                            effects: []
                                        }
                                    ]
                                )
                            }
                        />
                    )}
                    {!isDataEmpty &&
                    plotParameters.type === 'bump' && (
                        <ResponsiveBump
                            data={plotData}
                            theme={{ fontFamily: 'Saira, sans-serif' }}
                            margin={{ top: 10, right: 100, bottom: 20, left: 50 }}
                            colors={(d) => d.color}
                            lineWidth={2}
                            activeLineWidth={4}
                            inactiveLineWidth={2}
                            inactiveOpacity={0.15}
                            pointSize={0}
                            activePointSize={0}
                            inactivePointSize={0}
                            pointBorderWidth={3}
                            activePointBorderWidth={3}
                            enableGridX={false}
                            enableGridY={false}
                            axisRight={null}
                            axisTop={null}
                            axisBottom={null}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0
                            }}
                            onClick={(serie) => {
                                // TODO: map may also needs to be changed
                                if (isMobile || isIPad13) return
                                this.props.regionToggle(
                                    currentRegion.length === 1 && currentRegion[0] === str.GLOBAL_ZH
                                        ? [ serie.name ]
                                        : [ ...currentRegion, serie.name ]
                                )
                            }}
                            tooltip={plotParameters.tooltip}
                        />
                    )}
                    {!isDataEmpty &&
                    plotParameters.type === 'stream' && (
                        <ResponsiveStream
                            data={plotData}
                            keys={plotDataAll.plotKeys}
                            theme={plotTheme}
                            margin={{ top: 20, right: 115, bottom: 35, left: 40 }}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                orient: 'bottom',
                                tickSize: 0,
                                tickPadding: 5,
                                tickRotation: 0,
                                format: (idx) =>
                                    plotParameters.xAxisFormat(idx, Math.round(plotData.length / 5), plotDataAll.dates)
                            }}
                            axisLeft={{
                                orient: 'left',
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                tickValues: 5,
                                format: plotParameters.yAxisFormat
                            }}
                            offsetType="silhouette"
                            colors={(d) =>
                                darkMode
                                    ? [ 0, 1, 2, 3, 4, 5 ].map((x) => `var(--primary-color-${x})`)[
                                          plotDataAll.plotKeys.length - 1 - d.index
                                      ]
                                    : [ 8, 6, 5, 4, 3, 2 ].map((x) => `var(--primary-color-${x})`)[
                                          plotDataAll.plotKeys.length - 1 - d.index
                                      ]}
                            fillOpacity={0.85}
                            animate={false}
                            enableGridX={false}
                            enableGridY={true}
                            legends={[
                                {
                                    anchor: 'right',
                                    direction: 'column',
                                    translateX: 100,
                                    itemWidth: 90,
                                    itemHeight: 20,
                                    itemTextColor: '#000',
                                    symbolSize: 12,
                                    symbolShape: 'circle'
                                }
                            ]}
                            isInteractive={true}
                            enableStackTooltip={true}
                            tooltipFormat={(x) => <b>{x.value}</b>}
                        />
                    )}
                </div>
            </div>
        )
    }
}
