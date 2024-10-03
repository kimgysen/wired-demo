
export interface KpPoint {
	x: number;
	y: number;
}

export interface KpCellProps {
	x: number;
	y: number;
	width?: number;
	height?: number;
}

export interface KpCell {
	id: string;
	props?: KpCellProps;
	data?: any;
}

export interface KpVertex extends KpCell {
	kind: string;
	type: string;
}

export interface KpEdge extends KpCell {
	kind: string;
	source: string;
	target: string;
	points?: KpPoint[];
}


export interface KpFlow {
	vertices: KpVertex[];
	edges: KpEdge[];
}

export const exampleFlowJson: KpFlow = {
	vertices: [
		{
			kind: 'vertex',
			id: 'id_1',
			type: 'input',
			props: {
				x: 350,
				y: 20,
				width: 30,
				height: 30
			},
			data: {
				method: 'input',
				name: 'input',
				script: '/demo/scripts/input.ts'
			}
		},
		{
			kind: 'vertex',
			id: 'id_2',
			type: 'apiClient',
			props: {
				x: 250,
				y: 100
			},
			data: {
				name: 'orderApi',
				method: 'getOrdersFromApi',
				script: '/demo/scripts/apiClient.ts'
			}
		},
		{
			kind: 'vertex',
			id: 'id_3',
			type: 'mapper',
			props: {
				x: 350,
				y: 200
			},
			data: {
				name: 'orderMapper',
				method: 'mapOrdersToProducts',
				script: '/demo/scripts/mapper.ts'
			}
		},
		{
			kind: 'vertex',
			id: 'id_4',
			type: 'filter',
			props: {
				x: 350,
				y: 300
			},
			data: {
				name: 'orderFilter',
				method: 'filterBooks',
				script: '/demo/scripts/filter.ts'
			}
		},
		{
			kind: 'vertex',
			id: 'id_5',
			type: 'output',
			props: {
				x: 350,
				y: 400,
				width: 30,
				height: 30
			},
			data: {
				name: 'output',
				method: 'output',
				script: '/demo/scripts/output.ts'
			}
		}
	],
	edges: [
		{
			kind: 'edge',
			id: 'id_1_2',
			source: 'id_1',
			target: 'id_2',
			points: [
				{
					"x": 350,
					"y": 35
				},
				{
					"x": 315,
					"y": 35
				},
				{
					"x": 315,
					"y": 130
				},
				{
					"x": 280,
					"y": 130
				}
			]
		},
		{
			kind: 'edge',
			id: 'id_2_3',
			source: 'id_2',
			target: 'id_3',
			points: [
				{
					"x": 271.25,
					"y": 140
				},
				{
					"x": 276,
					"y": 216
				},
				{
					"x": 350,
					"y": 219.14893617021275
				}
			]
		},
		{
			kind: 'edge',
			id: 'id_3_4',
			source: 'id_3',
			target: 'id_4'
		},
		{
			kind: 'edge',
			id: 'id_4_5',
			source: 'id_4',
			target: 'id_5'
		}
	]
}

const requirements = {
	apiClient: [
		{
			target: {
				type: 'server'
			}
		}
	]
}