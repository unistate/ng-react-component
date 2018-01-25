
import { EventEmitter, NgZone, Input, Output, KeyValueDiffer } from '@angular/core';
import { OnChanges, KeyValueChanges, DoCheck, KeyValueDiffers, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/share';

function defaults(target: any, options: any): KeyValue {
    if (target === null || (typeof target !== 'object' && typeof target !== 'function')) {
        target = {};
    }
    if (options) {
        target = { ...target, ...options };
    }
    return target;
}
export interface KeyValue {
    [key: string]: any;
}
export abstract class ReactComponent<P extends KeyValue, T extends KeyValue> implements OnChanges, DoCheck {
    @Input() state: T;
    get state$(): Observable<KeyValue> {
        return this.stateChange.share();
    }
    @Input() props: P;
    get props$(): Observable<P> {
        return this.propsChange.share();
    }
    @Output() stateChange: EventEmitter<T> = new EventEmitter();
    @Output() propsChange: EventEmitter<P> = new EventEmitter();
    private _stateDiffer: KeyValueDiffer<string, any>;
    private _propsDiffer: KeyValueDiffer<string, any>;
    constructor(
        private _differs: KeyValueDiffers
    ) {
        this.props = {} as P;
        this.state = {} as T;
    }

    setState(state: T): void {
        this._stateDiffer = this._differs.find(this.state).create();
        this.state = defaults(this.state, state) as T;
        this.ngDoCheck();
    }

    setProps(props: P): void {
        this._propsDiffer = this._differs.find(this.props).create();
        this.props = defaults(this.props, props) as P;
        this.ngDoCheck();
    }

    ngOnChanges(changes: SimpleChanges) {
        if ('props' in changes) {
            const value = changes['props'].currentValue;
            this._propsDiffer = this._differs.find(value).create();
        }
        if ('state' in changes) {
            const value = changes['state'].currentValue;
            this._stateDiffer = this._differs.find(value).create();
        }
    }

    ngDoCheck(): void {
        if (this._propsDiffer) {
            const changes = this._propsDiffer.diff(this.props);
            if (changes) this._propsChanges(changes);
        }
        if (this._stateDiffer) {
            const changes = this._stateDiffer.diff(this.state);
            if (changes) this._stateChanges(changes);
        }
    }

    private _stateChanges(changes) {
        this.onStateChange(changes);
        this.stateChange.emit(this.state);
    }
    private _propsChanges(changes) {
        this.onPropsChange(changes);
        this.propsChange.emit(this.props);
    }
    abstract onPropsChange(changes: KeyValueChanges<string, P>): void;
    abstract onStateChange(changes: KeyValueChanges<string, T>): void;
}
