import { Identify } from 'amplitude-js';
import { Client } from './client';

const LOCAL_STORAGE_EXPERIMENTS_PREFIX = '__analytics_experiments_';

/** Experiment interface allows getting a variation for a specified user. */
export interface Experiment<Variation extends string> {
	name: string;
	engage(userId: string): Variation;
}

interface VariationData<Variation> {
	variation: Variation;
	targetPercent: number;
}

const checkPercent = (f: number) => {
	if (isNaN(f) || f < 0 || f > 100) {
		throw new Error(
			'Variation target percent must be defined as a percent value between 0 and 100',
		);
	}
};

/** LocalExperiment allows describing an Experiment implemented with local storage. */
export class LocalExperiment<Variation extends string>
	implements Experiment<Variation>
{
	private readonly data: VariationData<Variation>[] = [];
	private coveredPercent: number = 0;

	constructor(
		public readonly name: string,
		private readonly analytics?: Client,
	) {}

	private checkDuplicates(variation: Variation) {
		const present = this.data.find((d) => d.variation === variation);
		if (present != null) {
			throw new Error(
				`Variation [${present.variation} ${present.targetPercent}%] already exists in experiment ${this.name}.`,
			);
		}
	}

	private static dataString(data: VariationData<any>[]): string {
		return data
			.map((d) => `variation ${d.variation}: ${d.targetPercent}%`)
			.join(', ');
	}

	private static amplitudePreInsert(
		identify: Identify,
		name: string,
		value: string,
	): Identify {
		// XXX: $preInsert is documented but not exposed in the JS SDK.
		// https://help.amplitude.com/hc/en-us/articles/205406617#keys-for-the-identification-argument
		(identify as any)._addOperation('$preInsert', name, value);
		return identify;
	}

	private identify(result: Variation) {
		if (this.analytics != null) {
			this.analytics
				.amplitude()
				.identify(
					LocalExperiment.amplitudePreInsert(
						new Identify(),
						'Experiments',
						`${this.name}_${result}`,
					),
				);
		}
	}

	define(
		variation: Variation,
		targetPercent: number,
	): LocalExperiment<Variation> {
		checkPercent(targetPercent);
		this.checkDuplicates(variation);
		const varData = { variation, targetPercent };

		this.coveredPercent += targetPercent;
		if (this.coveredPercent > 100) {
			const allData = LocalExperiment.dataString(this.data.concat(varData));
			throw new Error(
				`Incorrect target percent in experiment ${this.name}. Sum of fractions is greater than 100%: ${allData}`,
			);
		}

		this.data.push(varData);
		return this;
	}

	engage(deviceId: string): Variation {
		if (this.data.length === 0) {
			throw new Error(`Variations are not defined for experiment ${this.name}`);
		}
		if (this.coveredPercent < 100) {
			throw new Error(
				`Experiment ${
					this.name
				} is not fully defined. Current data: ${LocalExperiment.dataString(
					this.data,
				)}`,
			);
		}

		if (window?.localStorage == null) {
			// No storage support. Return a consistent result.
			return this.data[0].variation;
		}

		const key = `${LOCAL_STORAGE_EXPERIMENTS_PREFIX}${this.name}_${deviceId}`;
		const value = window.localStorage.getItem(key);
		if (value != null) {
			this.identify(value as Variation);
			return value as Variation;
		}

		const dieRoll = Math.random() * 100;
		let result: Variation | null = null;
		let margin = 0;
		for (const varData of this.data) {
			margin += varData.targetPercent;
			if (dieRoll < margin) {
				result = varData.variation;
				break;
			}
		}
		if (result == null) {
			throw new Error(
				`Variations implementation problem: ${LocalExperiment.dataString(
					this.data,
				)}`,
			);
		}

		window.localStorage.setItem(key, result);
		this.identify(result);

		return result;
	}
}
