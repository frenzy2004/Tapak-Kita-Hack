import React, { useState, useEffect } from 'react';
import { Cloud, Thermometer, Droplets, TrendingUp } from 'lucide-react';
import {
    getWeatherForecast,
    WeatherData,
    translateForecast,
    getWeatherEmoji
} from '../services/weatherService';

interface WeatherCardProps {
    location: string;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ location }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getWeatherForecast(location);
                if (data) {
                    setWeather(data);
                } else {
                    setError('Weather data unavailable for this area');
                }
            } catch (err) {
                setError('Failed to load weather data');
            } finally {
                setIsLoading(false);
            }
        };

        if (location) {
            fetchWeather();
        }
    }, [location]);

    if (isLoading) {
        return (
            <div className="bg-card rounded-xl shadow-lg p-6 border border-border animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                    <Cloud className="w-5 h-5 text-primary" />
                    <div className="h-5 bg-muted rounded w-40"></div>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error || !weather) {
        return null;
    }

    const impactColor = weather.weatherImpact === 'positive'
        ? 'text-success'
        : weather.weatherImpact === 'neutral'
            ? 'text-warning'
            : 'text-destructive';

    const impactBg = weather.weatherImpact === 'positive'
        ? 'bg-success/10 border-success/20'
        : weather.weatherImpact === 'neutral'
            ? 'bg-warning/10 border-warning/20'
            : 'bg-destructive/10 border-destructive/20';

    return (
        <div className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-border animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-primary" />
                    Weather Forecast
                </h3>
                <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                    📍 {weather.locationName}
                </span>
            </div>

            {/* Weather Impact Summary */}
            <div className={`rounded-lg p-4 mb-4 border ${impactBg}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`text-sm font-semibold ${impactColor}`}>
                            {weather.weatherImpact === 'positive' ? '☀️ Good for Business' :
                                weather.weatherImpact === 'neutral' ? '🌤️ Moderate Conditions' :
                                    '🌧️ Weather Advisory'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{weather.summary}</p>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${impactColor}`}>
                            {weather.weatherImpactScore}
                        </div>
                        <div className="text-xs text-muted-foreground">Impact Score</div>
                    </div>
                </div>
            </div>

            {/* Current Temperature & Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-muted rounded-lg p-3 text-center">
                    <Thermometer className="w-4 h-4 mx-auto mb-1 text-orange-400" />
                    <div className="text-lg font-bold text-foreground">
                        {weather.currentTemp.min}°-{weather.currentTemp.max}°C
                    </div>
                    <div className="text-xs text-muted-foreground">Today</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                    <Droplets className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                    <div className="text-lg font-bold text-foreground">
                        {weather.rainyDays}/{weather.totalDays}
                    </div>
                    <div className="text-xs text-muted-foreground">Rainy Days</div>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                    <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-400" />
                    <div className="text-lg font-bold text-foreground">
                        {Math.round((1 - weather.rainyDays / weather.totalDays) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Clear Days</div>
                </div>
            </div>

            {/* 7-Day Forecast Table */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground mb-2">7-Day Forecast</h4>
                <div className="space-y-1.5">
                    {weather.forecasts.slice(0, 7).map((f, i) => {
                        const date = new Date(f.date);
                        const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        return (
                            <div
                                key={f.date + f.location.location_id}
                                className={`flex items-center justify-between py-2 px-3 rounded-lg ${i === 0 ? 'bg-primary/5 border border-primary/10' : 'hover:bg-muted/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-lg">{getWeatherEmoji(f.summary_forecast)}</span>
                                    <div>
                                        <span className="text-sm font-medium text-foreground">{dayName}</span>
                                        <span className="text-xs text-muted-foreground ml-1.5">{dateStr}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-muted-foreground hidden sm:block">
                                        {translateForecast(f.summary_forecast)}
                                    </span>
                                    <span className="text-sm font-medium text-foreground whitespace-nowrap">
                                        {f.min_temp}°-{f.max_temp}°C
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Data source */}
            <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                    Data from MET Malaysia via <a href="https://developer.data.gov.my" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">data.gov.my</a>
                </p>
            </div>
        </div>
    );
};

export default WeatherCard;
