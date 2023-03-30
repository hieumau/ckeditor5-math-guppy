import View from '@ckeditor/ckeditor5-ui/src/view';
import ViewCollection from '@ckeditor/ckeditor5-ui/src/viewcollection';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import SwitchButtonView from '@ckeditor/ckeditor5-ui/src/button/switchbuttonview';
import LabeledInputView from '@ckeditor/ckeditor5-ui/src/labeledinput/labeledinputview';
import InputTextView from '@ckeditor/ckeditor5-ui/src/inputtext/inputtextview';
import LabelView from '@ckeditor/ckeditor5-ui/src/label/labelview';

import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';
import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';
import FocusCycler from '@ckeditor/ckeditor5-ui/src/focuscycler';

import checkIcon from '@ckeditor/ckeditor5-core/theme/icons/check.svg';
import cancelIcon from '@ckeditor/ckeditor5-core/theme/icons/cancel.svg';

import submitHandler from '@ckeditor/ckeditor5-ui/src/bindings/submithandler';

import { extractDelimiters, hasDelimiters } from '../utils';

import MathView from './mathview';

import '../../theme/mathform.css';

import '../../theme/mathform.css';
import '../../theme/guppy-default-osk.min.css';
import { Guppy } from '../guppy/guppy';

export default class MainFormView extends View {
	constructor( locale, engine, lazyLoad, previewEnabled, previewUid, previewClassName, popupClassName, katexRenderOptions ) {
		super( locale );

		const t = locale.t;

		// Create key event & focus trackers
		this._createKeyAndFocusTrackers();

		// Submit button
		this.saveButtonView = this._createButton( t( 'Save' ), checkIcon, 'ck-button-save', null );
		this.saveButtonView.type = 'submit';

		// Equation input
		this.mathInputView = this._createMathInput();

		this.inputGuppyView = this._createMathInput_2();

		// Display button
		this.displayButtonView = this._createDisplayButton();

		// Cancel button
		this.cancelButtonView = this._createButton( t( 'Cancel' ), cancelIcon, 'ck-button-cancel', 'cancel' );

		this.previewEnabled = previewEnabled;

		this.guppyView = {
			tag: 'div',
			attributes: {
				class: [
					'ck-reset_all-excluded',
					'guppy-container'
				],
				id: 'guppy'
			}
		};

		this.guppy = null;

		let children = [];
		if (this.previewEnabled) {
			// Preview label
			this.previewLabel = new LabelView( locale );
			this.previewLabel.text = t( 'Edit equation' );

			// Math element
			this.mathView = new MathView( engine, lazyLoad, locale, previewUid, previewClassName, katexRenderOptions );
			this.mathView.bind( 'display' ).to( this.displayButtonView, 'isOn' );

			children = [
				// this.mathInputView,
				this.displayButtonView,
				this.previewLabel,
				this.mathView,
				this.guppyView,
				this.inputGuppyView
			];
		} else {
			children = [
				// this.mathInputView,
				this.displayButtonView,
				this.guppyView,
				this.inputGuppyView
			];
		}

		// Add UI elements to template
		this.setTemplate(
			{
				tag: 'div',
				attributes: {
					class: [
						'ck-reset_all-excluded'
					]
				},
				children: [
					{
						tag: 'form',
						attributes: {
							class: [
								'ck',
								'ck-math-form',
								...popupClassName
							],
							tabindex: '-1',
							spellcheck: 'false'
						},
						children: [
							{
								tag: 'div',
								attributes: {
									class: [
										'ck-math-view'
									]
								},
								children
							},
							this.saveButtonView,
							this.cancelButtonView
						]
					}
				]
			}
		);
	}

	render() {
		super.render();

		// Prevent default form submit event & trigger custom 'submit'
		submitHandler( {
			view: this
		} );

		// Register form elements to focusable elements
		const childViews = [
			// this.mathInputView,
			this.displayButtonView,
			this.saveButtonView,
			this.cancelButtonView
		];

		childViews.forEach( v => {
			this._focusables.add( v );
			this.focusTracker.add( v.element );
		} );

		// Listen to keypresses inside form element
		this.keystrokes.listenTo( this.element );

	}

	focus() {
		this._focusCycler.focusFirst();
	}

	get equation() {
		return document.getElementById( 'input-guppy' ).value;
		// return this.mathInputView.fieldView.element.value;
	}

	set equation( equation ) {
		let input = document.getElementById( 'input-guppy' );
		console.log( equation );

		if (input) {
			input.value = equation;
		}
		// this.guppy = new Guppy( 'guppy' );
		// this.guppy.doc().import_latex(equation)
	}

	get xml() {
		return document.getElementById( 'input-guppy' ).getAttribute( 'xml' );
		// return this.mathInputView.fieldView.element.value;
	}

	set xml( xml ) {
		document.getElementById( 'input-guppy' ).setAttribute( 'xml', xml );
		this.guppy = new Guppy( 'guppy' );
		if (this.guppy) {
			this.guppy.engine.set_content( xml );
		}
	}

	_createKeyAndFocusTrackers() {
		this.focusTracker = new FocusTracker();
		this.keystrokes = new KeystrokeHandler();
		this._focusables = new ViewCollection();

		this._focusCycler = new FocusCycler( {
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				focusPrevious: 'shift + tab',
				focusNext: 'tab'
			}
		} );
	}

	_createMathInput_2() {
		let inputGuppyView = {
			tag: 'input',
			attributes: {
				class: [
					'ck-reset_all-excluded'
				],
				id: 'input-guppy',
				style: {
					display: 'none'
				}
			}
		};
		return inputGuppyView;
	}

	_createMathInput() {

		console.log(Guppy);
		const t = this.locale.t;

		// Create equation input
		const mathInput = new LabeledFieldView( this.locale, createLabeledInputText );
		const fieldView = mathInput.fieldView;
		mathInput.infoText = t( 'Insert equation in TeX format.' );

		const onInput = () => {
			if (fieldView.element != null) {
				let equationInput = fieldView.element.value.trim();

				// If input has delimiters
				if (hasDelimiters( equationInput )) {
					// Get equation without delimiters
					const params = extractDelimiters( equationInput );

					// Remove delimiters from input field
					fieldView.element.value = params.equation;

					equationInput = params.equation;

					// update display button and preview
					this.displayButtonView.isOn = params.display;
				}
				if (this.previewEnabled) {
					// Update preview view
					this.mathView.value = equationInput;
				}

				this.saveButtonView.isEnabled = !!equationInput;
			}
		};

		fieldView.on( 'render', onInput );
		fieldView.on( 'input', onInput );

		return mathInput;
	}

	_createButton( label, icon, className, eventName ) {
		const button = new ButtonView( this.locale );

		button.set( {
			label,
			icon,
			tooltip: true
		} );

		button.extendTemplate( {
			attributes: {
				class: className
			}
		} );

		if (eventName) {
			button.delegate( 'execute' ).to( this, eventName );
		}

		return button;
	}

	_createDisplayButton() {
		const t = this.locale.t;

		const switchButton = new SwitchButtonView( this.locale );

		switchButton.set( {
			label: t( 'Show in new line' ),
			withText: true
		} );

		switchButton.extendTemplate( {
			attributes: {
				class: 'ck-button-display-toggle'
			}
		} );

		switchButton.on( 'execute', () => {
			// Toggle state
			switchButton.isOn = !switchButton.isOn;

			if (this.previewEnabled) {
				// Update preview view
				this.mathView.display = switchButton.isOn;
			}
		} );

		return switchButton;
	}
}
